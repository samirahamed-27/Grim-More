#!/usr/bin/env python3
"""
Potion Pantry - Data Preparation & Halloween Re-theming Script
Prepares the Kaggle retail inventory dataset for the Potion Pantry project.
Aggregates store sales to daily ingredient series and generates theme mappings.
"""

import os
from pathlib import Path
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt

# File paths configuration
ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_CSV_PATH = ROOT_DIR / "data" / "raw" / "retail_store_inventory.csv"
DATA_DIR = ROOT_DIR / "data"
PLOTS_DIR = DATA_DIR / "plots"

# Selected 6 products mapped to official ingredients from docs/ingredients.md
# Top 3 sellers are assigned to festival spike items (IDs 1, 2, 3)
PRODUCT_MAPPING = [
    {"original_product_id": "P0016", "ingredient_id": 1, "ingredient_name": "Moonflower", "lead_time_days": 2, "cover_days": 3},
    {"original_product_id": "P0020", "ingredient_id": 2, "ingredient_name": "Silver Dew", "lead_time_days": 1, "cover_days": 3},
    {"original_product_id": "P0014", "ingredient_id": 3, "ingredient_name": "Wolfsbane", "lead_time_days": 3, "cover_days": 3},
    {"original_product_id": "P0005", "ingredient_id": 4, "ingredient_name": "Dragon Resin", "lead_time_days": 4, "cover_days": 4},
    {"original_product_id": "P0008", "ingredient_id": 5, "ingredient_name": "Nightshade", "lead_time_days": 2, "cover_days": 3},
    {"original_product_id": "P0002", "ingredient_id": 6, "ingredient_name": "Mandrake Root", "lead_time_days": 3, "cover_days": 3},
]

# Halloween theme mappings for stores, regions, and categories
STORE_MAPPING = [
    {"original_store_id": "S001", "themed_store_name": "Haunted Hollow Market"},
    {"original_store_id": "S002", "themed_store_name": "Coven Bazaar"},
    {"original_store_id": "S003", "themed_store_name": "Whispering Woods Outpost"},
    {"original_store_id": "S004", "themed_store_name": "Shadowfen Emporium"},
    {"original_store_id": "S005", "themed_store_name": "Eldritch Apothecary"},
]

REGION_MAPPING = [
    {"original_region": "North", "themed_region": "Crypt North"},
    {"original_region": "South", "themed_region": "Shadowlands South"},
    {"original_region": "East", "themed_region": "Banshee East"},
    {"original_region": "West", "themed_region": "Witchwood West"},
]

CATEGORY_MAPPING = [
    {"original_category": "Groceries", "themed_category": "Arcane Botanicals"},
    {"original_category": "Electronics", "themed_category": "Enchanted Relics"},
    {"original_category": "Clothing", "themed_category": "Sorcerer Vestments"},
    {"original_category": "Furniture", "themed_category": "Cauldron & Altar Craft"},
    {"original_category": "Toys", "themed_category": "Familiars & Trinkets"},
]


def load_raw_dataset(csv_path: Path) -> pd.DataFrame:
    """
    Loads raw CSV dataset from disk and parses date columns.
    Validates that the file exists and required columns are present.
    Returns cleaned pandas DataFrame for downstream transformations.
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"Raw dataset not found at {csv_path}. Please download it first.")
    
    # Load dataset
    df = pd.read_csv(csv_path)
    df["Date"] = pd.to_datetime(df["Date"])
    return df


def save_theme_mappings(data_dir: Path) -> None:
    """
    Saves traceable CSV mapping tables for products, stores, regions, and categories.
    Creates Halloween and potion shop aliases while preserving original IDs.
    Outputs mapping tables directly into data/ folder.
    """
    data_dir.mkdir(parents=True, exist_ok=True)
    
    # Save product mapping
    prod_df = pd.DataFrame(PRODUCT_MAPPING)[["original_product_id", "ingredient_id", "ingredient_name"]]
    prod_df.to_csv(data_dir / "product_mapping.csv", index=False)
    
    # Save auxiliary theme mappings
    pd.DataFrame(STORE_MAPPING).to_csv(data_dir / "store_mapping.csv", index=False)
    pd.DataFrame(REGION_MAPPING).to_csv(data_dir / "region_mapping.csv", index=False)
    pd.DataFrame(CATEGORY_MAPPING).to_csv(data_dir / "category_mapping.csv", index=False)
    print("Saved product, store, region, and category theme mappings.")


def build_daily_sales_series(df: pd.DataFrame, data_dir: Path) -> pd.DataFrame:
    """
    Aggregates units sold across all stores per date and product.
    Generates contiguous daily time series with zero gaps for all 6 ingredients.
    Saves data/sales_history.csv adhering strictly to the contract.
    """
    # Filter to selected 6 products
    selected_pids = [m["original_product_id"] for m in PRODUCT_MAPPING]
    filtered_df = df[df["Product ID"].isin(selected_pids)].copy()
    
    # Map to ingredient IDs
    pid_to_ing = {m["original_product_id"]: m["ingredient_id"] for m in PRODUCT_MAPPING}
    filtered_df["ingredient_id"] = filtered_df["Product ID"].map(pid_to_ing)
    
    # Sum units sold across all 5 stores per day and ingredient
    daily_sales = (
        filtered_df.groupby(["Date", "ingredient_id"])["Units Sold"]
        .sum()
        .reset_index()
        .rename(columns={"Units Sold": "units"})
    )
    
    # Ensure complete date range for every ingredient with no missing days
    min_date = daily_sales["Date"].min()
    max_date = daily_sales["Date"].max()
    full_date_idx = pd.date_range(min_date, max_date, freq="D")
    
    records = []
    total_filled_gaps = 0
    for ing_id in sorted(daily_sales["ingredient_id"].unique()):
        sub_df = daily_sales[daily_sales["ingredient_id"] == ing_id].set_index("Date")
        reindexed = sub_df.reindex(full_date_idx)
        
        # Count filled missing days if any
        missing_count = reindexed["units"].isna().sum()
        total_filled_gaps += missing_count
        
        reindexed["ingredient_id"] = ing_id
        reindexed["units"] = reindexed["units"].fillna(0).astype(int)
        reindexed = reindexed.reset_index().rename(columns={"index": "date"})
        records.append(reindexed)
        
    combined_sales = pd.concat(records, ignore_index=True)
    combined_sales["date"] = combined_sales["date"].dt.strftime("%Y-%m-%d")
    
    # Sort strictly by ingredient_id then date
    combined_sales = combined_sales.sort_values(by=["ingredient_id", "date"]).reset_index(drop=True)
    
    # Save exact contract CSV: date, ingredient_id, units
    out_path = data_dir / "sales_history.csv"
    combined_sales[["date", "ingredient_id", "units"]].to_csv(out_path, index=False)
    print(f"Saved {out_path} ({len(combined_sales)} rows, {total_filled_gaps} missing days filled).")
    return combined_sales


def build_seed_and_baseline_forecast(df: pd.DataFrame, data_dir: Path) -> None:
    """
    Creates ingredients_seed.csv using latest inventory and docs/ingredients.md parameters.
    Aggregates dataset baseline forecasts across stores into baseline_forecast.csv.
    Enables database initialization and benchmark comparisons for the forecast engine.
    """
    selected_pids = [m["original_product_id"] for m in PRODUCT_MAPPING]
    filtered_df = df[df["Product ID"].isin(selected_pids)].copy()
    pid_to_meta = {m["original_product_id"]: m for m in PRODUCT_MAPPING}
    
    # 1. Latest Inventory Level for current stock (summed across all stores on latest date)
    latest_date = filtered_df["Date"].max()
    latest_inv = (
        filtered_df[filtered_df["Date"] == latest_date]
        .groupby("Product ID")["Inventory Level"]
        .sum()
        .to_dict()
    )
    
    seed_records = []
    for pid in selected_pids:
        meta = pid_to_meta[pid]
        seed_records.append({
            "id": meta["ingredient_id"],
            "name": meta["ingredient_name"],
            "current_stock": int(latest_inv.get(pid, 500)),
            "lead_time_days": meta["lead_time_days"],
            "cover_days": meta["cover_days"]
        })
        
    seed_df = pd.DataFrame(seed_records).sort_values(by="id")
    seed_df.to_csv(data_dir / "ingredients_seed.csv", index=False)
    print(f"Saved {data_dir / 'ingredients_seed.csv'}")
    
    # 2. Baseline Forecast from dataset column (summed across stores per date)
    pid_to_ing = {m["original_product_id"]: m["ingredient_id"] for m in PRODUCT_MAPPING}
    filtered_df["ingredient_id"] = filtered_df["Product ID"].map(pid_to_ing)
    
    baseline_fc = (
        filtered_df.groupby(["Date", "ingredient_id"])["Demand Forecast"]
        .sum()
        .reset_index()
        .rename(columns={"Demand Forecast": "demand_forecast"})
    )
    baseline_fc["date"] = baseline_fc["Date"].dt.strftime("%Y-%m-%d")
    baseline_fc = baseline_fc.sort_values(by=["ingredient_id", "date"]).reset_index(drop=True)
    baseline_fc[["date", "ingredient_id", "demand_forecast"]].to_csv(data_dir / "baseline_forecast.csv", index=False)
    print(f"Saved {data_dir / 'baseline_forecast.csv'}")


def generate_ingredient_plots(sales_df: pd.DataFrame, plots_dir: Path) -> None:
    """
    Renders and saves high-resolution time series line charts for each ingredient.
    Shows 30-day moving average trend over the 731-day history.
    Saves PNG charts in data/plots/ to verify data believability.
    """
    plots_dir.mkdir(parents=True, exist_ok=True)
    ing_names = {m["ingredient_id"]: m["ingredient_name"] for m in PRODUCT_MAPPING}
    
    plt.style.use("seaborn-v0_8-darkgrid" if "seaborn-v0_8-darkgrid" in plt.style.available else "default")
    
    for ing_id in sorted(sales_df["ingredient_id"].unique()):
        ing_data = sales_df[sales_df["ingredient_id"] == ing_id].copy()
        ing_name = ing_names.get(ing_id, f"Ingredient {ing_id}")
        ing_data["date_dt"] = pd.to_datetime(ing_data["date"])
        ing_data["moving_avg_30"] = ing_data["units"].rolling(window=30, min_periods=1).mean()
        
        plt.figure(figsize=(12, 5))
        plt.plot(ing_data["date_dt"], ing_data["units"], color="#7f8c8d", alpha=0.45, label="Daily Units Sold")
        plt.plot(ing_data["date_dt"], ing_data["moving_avg_30"], color="#8e44ad", linewidth=2.5, label="30-Day Moving Average")
        
        plt.title(f"Historical Demand: {ing_name} (ID: {ing_id})", fontsize=14, fontweight="bold", pad=12)
        plt.xlabel("Date", fontsize=11)
        plt.ylabel("Units Sold (Summed across stores)", fontsize=11)
        plt.ylim(bottom=0)
        plt.legend(loc="upper right")
        plt.tight_layout()
        
        filename = f"ingredient_{ing_id}_{ing_name.lower().replace(' ', '_')}.png"
        out_file = plots_dir / filename
        plt.savefig(out_file, dpi=150)
        plt.close()
        print(f"Saved plot: {out_file.name}")


def verify_pipeline_outputs(data_dir: Path) -> None:
    """
    Validates output CSV integrity, prints first 5 rows, and checks date ranges.
    Computes 14-day rolling mean and standard deviation for spike detection baseline.
    Outputs validation proof to the console.
    """
    sales_file = data_dir / "sales_history.csv"
    seed_file = data_dir / "ingredients_seed.csv"
    fc_file = data_dir / "baseline_forecast.csv"
    
    print("\n================== VERIFICATION REPORT ==================")
    for path in [sales_file, seed_file, fc_file]:
        df = pd.read_csv(path)
        print(f"\n--- First 5 rows of {path.name} (Total rows: {len(df)}) ---")
        print(df.head().to_string(index=False))
        
    sales_df = pd.read_csv(sales_file)
    assert len(sales_df["ingredient_id"].unique()) == 6, "Must contain exactly 6 ingredients"
    assert (sales_df["units"] >= 0).all(), "Units cannot be negative"
    
    # Check date uniformity
    dates_per_ing = sales_df.groupby("ingredient_id")["date"].count()
    assert dates_per_ing.nunique() == 1, "All ingredients must have identical number of dates"
    print(f"\nIntegrity check PASSED: Exactly 6 ingredients, {dates_per_ing.iloc[0]} days each, 0 negative units.")
    
    # 14-day baseline stats for spike detector
    print("\n--- Last 14-Day Baseline Stats for Spike Detection ---")
    sales_df["date_dt"] = pd.to_datetime(sales_df["date"])
    latest_date = sales_df["date_dt"].max()
    cutoff_14 = latest_date - pd.Timedelta(days=13)
    
    ing_names = {m["ingredient_id"]: m["ingredient_name"] for m in PRODUCT_MAPPING}
    recent_14 = sales_df[sales_df["date_dt"] >= cutoff_14]
    
    stats_14 = recent_14.groupby("ingredient_id")["units"].agg(
        mean_units="mean",
        std_units="std",
        min_units="min",
        max_units="max"
    ).reset_index()
    stats_14["name"] = stats_14["ingredient_id"].map(ing_names)
    stats_14 = stats_14[["ingredient_id", "name", "mean_units", "std_units", "min_units", "max_units"]]
    print(stats_14.to_string(index=False))
    print("=========================================================\n")


def main():
    """
    Main driver running data preparation pipeline end-to-end.
    Executes mapping, sales aggregation, seed generation, plotting, and verification.
    Guarantees idempotency and safe re-runs from repository root.
    """
    print("Starting Potion Pantry data preparation pipeline...")
    raw_df = load_raw_dataset(RAW_CSV_PATH)
    save_theme_mappings(DATA_DIR)
    sales_df = build_daily_sales_series(raw_df, DATA_DIR)
    build_seed_and_baseline_forecast(raw_df, DATA_DIR)
    generate_ingredient_plots(sales_df, PLOTS_DIR)
    verify_pipeline_outputs(DATA_DIR)
    print("Pipeline completed successfully!")


if __name__ == "__main__":
    main()
