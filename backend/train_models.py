"""
Potion Pantry - Model Training Script (backend/train_models.py)
Trains Machine Learning forecast models (Ridge Regression) for all 6 ingredients
using the historical sales data from data/sales_history.csv (or SQLite db).
Saves models to backend/ml_models/.
"""

import sys
from pathlib import Path
import pandas as pd

# Add repo root to sys.path
REPO_ROOT = Path(__file__).resolve().parent.parent
if str(REPO_ROOT) not in sys.path:
    sys.path.insert(0, str(REPO_ROOT))

from backend.ml_forecast import train_ml_model, ml_forecast

DATA_CSV = REPO_ROOT / "data" / "sales_history.csv"


def train_all_ingredients(csv_path: Path = DATA_CSV):
    """Loads sales_history.csv and trains an ML model for each ingredient (1 to 6)."""
    if not csv_path.exists():
        raise FileNotFoundError(f"Sales history file not found at {csv_path}")

    print(f"Loading historical sales data from {csv_path.name}...")
    df = pd.read_csv(csv_path)

    # Ensure chronological ordering
    df["date"] = pd.to_datetime(df["date"])
    df = df.sort_values(by=["ingredient_id", "date"]).reset_index(drop=True)

    ingredient_ids = sorted(df["ingredient_id"].unique())
    print(f"Found {len(ingredient_ids)} ingredients. Starting ML model training...\n")

    for ing_id in ingredient_ids:
        ing_data = df[df["ingredient_id"] == ing_id]
        history = ing_data["units"].astype(int).tolist()
        print(f"-> Training Ridge Regression model for Ingredient ID {ing_id} ({len(history)} daily data points)...")
        train_ml_model(history, ingredient_id=int(ing_id))

        # Quick inference test
        test_pred = ml_forecast(history[-30:], days_ahead=3, ingredient_id=int(ing_id))
        print(f"   3-day sample prediction: {test_pred}")

    print("\n[SUCCESS] All ingredient models trained and saved to backend/ml_models/!")


if __name__ == "__main__":
    train_all_ingredients()
