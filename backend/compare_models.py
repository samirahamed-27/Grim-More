"""
Potion Pantry - Model Comparison & Evaluation Script (backend/compare_models.py)
Compares the Classical 7-Day Moving Average against the Machine Learning Ridge Regression model
on the last 14 days of historical data for all 6 ingredients.
"""

import sys
from pathlib import Path
import pandas as pd
import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.forecasting import forecast_demand
from backend.ml_forecast import ml_forecast

DATA_CSV = REPO_ROOT / "data" / "sales_history.csv"


def calc_metrics(actuals, preds):
    actuals = np.array(actuals, dtype=float)
    preds = np.array(preds, dtype=float)
    mae = np.mean(np.abs(actuals - preds))
    mape = np.mean(np.abs((actuals - preds) / np.maximum(actuals, 1.0))) * 100.0
    return mae, mape


def run_comparison(holdout_days: int = 14):
    df = pd.read_csv(DATA_CSV)
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(by=["ingredient_id", "date"]).reset_index(drop=True)

    print("=" * 70)
    print(" " * 15 + f"MODEL BENCHMARK: LAST {holdout_days} DAYS")
    print("=" * 70)
    print(f"{'Ingredient':<16} | {'Classical MAE':<14} | {'ML (Ridge) MAE':<14} | {'Improvement':<12}")
    print("-" * 70)

    total_base_mae = 0.0
    total_ml_mae = 0.0
    names = {
        1: "Moonflower",
        2: "Silver Dew",
        3: "Wolfsbane",
        4: "Dragon Resin",
        5: "Nightshade",
        6: "Mandrake Root"
    }

    for ing_id in range(1, 7):
        ing_data = df[df["ingredient_id"] == ing_id]
        units = ing_data["units"].astype(int).tolist()

        train_data = units[:-holdout_days]
        test_actuals = units[-holdout_days:]

        # 1. Classical forecast
        base_preds = forecast_demand(train_data, days_ahead=holdout_days)

        # 2. ML forecast
        ml_preds = ml_forecast(train_data, days_ahead=holdout_days, ingredient_id=ing_id)

        base_mae, _ = calc_metrics(test_actuals, base_preds)
        ml_mae, _ = calc_metrics(test_actuals, ml_preds)

        total_base_mae += base_mae
        total_ml_mae += ml_mae

        diff = base_mae - ml_mae
        pct = (diff / base_mae) * 100.0
        status = f"{pct:+.1f}%" if pct > 0 else f"{pct:.1f}%"

        print(f"{names[ing_id]:<16} | {base_mae:<14.2f} | {ml_mae:<14.2f} | {status:<12}")

    print("-" * 70)
    avg_base = total_base_mae / 6.0
    avg_ml = total_ml_mae / 6.0
    avg_imp = ((avg_base - avg_ml) / avg_base) * 100.0
    print(f"{'AVERAGE':<16} | {avg_base:<14.2f} | {avg_ml:<14.2f} | {avg_imp:+.1f}%")
    print("=" * 70)


if __name__ == "__main__":
    run_comparison()
