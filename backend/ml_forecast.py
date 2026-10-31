"""
Potion Pantry - ML Forecasting Engine (backend/ml_forecast.py)
Drop-in replacement for forecast_demand() in forecasting.py.
Uses a Ridge Regression model trained on lag features and calendar features.
Falls back to the original 7-day moving average if no model has been trained yet.
"""

from __future__ import annotations

import math
import pickle
from pathlib import Path
from typing import List

# Where trained model files are saved (one per ingredient)
MODELS_DIR = Path(__file__).resolve().parent / "ml_models"

# Constant: same as forecasting.py so weekday alignment is consistent
START_WEEKDAY = 0  # 0 = Monday


def _build_feature_row(extended: List[float], i: int) -> List[float]:
    """
    Build a single feature vector for prediction at position i in the extended series.
    Features:
      - day_of_week     : 0 (Mon) to 6 (Sun) — captures weekend vs weekday pattern
      - day_of_month    : 1–30 proxy — captures month-end effects
      - month_proxy     : 0–11 proxy — captures seasonal patterns
      - lag_1           : units sold 1 day ago
      - lag_7           : units sold 7 days ago (same weekday last week)
      - lag_14          : units sold 14 days ago (same weekday 2 weeks ago)
      - rolling_7_mean  : average of last 7 days — captures recent trend
      - rolling_14_mean : average of last 14 days — captures slower trend
    """
    dow = float((START_WEEKDAY + i) % 7)
    dom = float((i % 30) + 1)
    month_proxy = float((i // 30) % 12)

    lag1 = float(extended[i - 1]) if i >= 1 else 0.0
    lag7 = float(extended[i - 7]) if i >= 7 else (float(extended[0]) if extended else 0.0)
    lag14 = float(extended[i - 14]) if i >= 14 else (float(extended[0]) if extended else 0.0)

    window7 = extended[max(0, i - 7):i]
    rolling7 = sum(window7) / len(window7) if window7 else 0.0

    window14 = extended[max(0, i - 14):i]
    rolling14 = sum(window14) / len(window14) if window14 else 0.0

    return [dow, dom, month_proxy, lag1, lag7, lag14, rolling7, rolling14]


def train_ml_model(history: List[int], ingredient_id: int) -> None:
    """
    Train and save a Ridge Regression model for one ingredient.

    Args:
        history: Full chronological sales list (oldest first). At least 20 values.
        ingredient_id: Integer 1–6 — used as the model filename.
    """
    import numpy as np
    from sklearn.linear_model import Ridge
    from sklearn.preprocessing import StandardScaler

    if len(history) < 20:
        raise ValueError(f"Need at least 20 days to train, got {len(history)}")

    X, y = [], []
    for i in range(14, len(history)):
        feat = _build_feature_row(list(history[:i]), i)
        X.append(feat)
        y.append(float(history[i]))

    X_arr = np.array(X, dtype=np.float64)
    y_arr = np.array(y, dtype=np.float64)

    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_arr)

    model = Ridge(alpha=10.0, solver="lsqr")
    model.fit(X_scaled, y_arr)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    model_path = MODELS_DIR / f"forecast_ing_{ingredient_id}.pkl"
    with open(model_path, "wb") as f:
        pickle.dump({"model": model, "scaler": scaler, "history_len": len(history)}, f)

    print(f"[ML] Saved forecast model for ingredient {ingredient_id} -> {model_path.name}")


def ml_forecast(
    history: List[int],
    days_ahead: int,
    event_multiplier: float = 1.0,
    ingredient_id: int = 1,
) -> List[float]:
    """
    Drop-in replacement for forecast_demand() from forecasting.py.

    Predicts the next `days_ahead` days of demand using a trained Ridge Regression
    model. If no model has been trained for this ingredient yet, falls back
    silently to the original 7-day moving average so the server never breaks.

    Args:
        history: Daily sales list, oldest first. At least 7 values.
        days_ahead: Number of future days to predict. Must be >= 1.
        event_multiplier: Festival demand multiplier (default 1.0 = no festival).
        ingredient_id: Which ingredient's model to load (1–6).

    Returns:
        list[float]: Predicted daily demand, length == days_ahead.
    """
    if days_ahead < 1:
        raise ValueError(f"days_ahead must be >= 1, got {days_ahead}")
    if len(history) < 7:
        raise ValueError(f"history must have at least 7 values, got {len(history)}")

    model_path = MODELS_DIR / f"forecast_ing_{ingredient_id}.pkl"

    # --- Fallback: no model trained yet ---
    if not model_path.exists():
        moving_avg = sum(history[-7:]) / 7.0
        return [float(moving_avg * event_multiplier)] * days_ahead

    # --- ML path ---
    with open(model_path, "rb") as f:
        bundle = pickle.load(f)
    model = bundle["model"]
    scaler = bundle["scaler"]

    extended = [float(v) for v in history]
    forecasts: List[float] = []

    for step in range(days_ahead):
        i = len(extended)
        feat = _build_feature_row(extended, i)
        feat_scaled = scaler.transform([feat])
        base_pred = max(0.0, float(model.predict(feat_scaled)[0]))
        pred = base_pred * float(event_multiplier)
        extended.append(base_pred)  # lag the underlying baseline demand
        forecasts.append(round(pred, 2))

    return forecasts
