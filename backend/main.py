"""
Potion Pantry - FastAPI Production Engine (backend/main.py)
Connects SQLite database (db.py), forecasting engine (forecasting.py),
spike detector (spike.py), and reorder logic (reorder.py) into real REST endpoints.
Strictly adheres to docs/contract.md schemas and CORS specifications.
"""

import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from backend.db import (
    init_db,
    get_connection,
    get_ingredients,
    get_recent_sales,
    insert_event,
    get_active_events,
    record_reorder,
    reset_state,
)
from backend.forecasting import forecast_demand
from backend.spike import detect_spike
from backend.reorder import calculate_reorder

# Initialize FastAPI application
app = FastAPI(
    title="Potion Pantry API",
    description="Track 01: Inventory prediction for a sudden festival demand spike",
    version="1.0.0",
)

# Enable CORS so frontend (Person C) can connect from anywhere (localhost:3000, 127.0.0.1, or file://)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup_event():
    """Ensures database tables exist and baseline CSV data is seeded on server start."""
    init_db()


# ---------------------------------------------------------------------------
# Pydantic Request Models
# ---------------------------------------------------------------------------
class EventAnnouncement(BaseModel):
    name: str = Field(..., description="Name of the festival or event")
    ingredient_ids: List[int] = Field(..., description="List of ingredient IDs affected")
    multiplier: float = Field(..., description="Demand multiplier during the event")
    start_date: str = Field(..., description="Start date (YYYY-MM-DD)")
    end_date: str = Field(..., description="End date (YYYY-MM-DD)")


# ---------------------------------------------------------------------------
# Core Business Logic Helpers
# ---------------------------------------------------------------------------
def compute_ingredient_state(ing: Dict[str, Any], active_events: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Executes the full pipeline for a single ingredient:
    DB Sales -> Spike Detection -> Forecast Rule -> Reorder Calculation.
    """
    ing_id = ing["id"]
    stock = ing["current_stock"]
    lead_time = ing["lead_time_days"]
    cover_days = ing["cover_days"]

    # 1. Fetch sales history from database
    sales_rows = get_recent_sales(ing_id, days=90)
    history_units = [row["units"] for row in sales_rows]

    # 2. Run spike detector
    spike_info = detect_spike(history_units)

    # 3. Determine active event multiplier for this ingredient
    event_multiplier = 1.0
    for ev in active_events:
        if ing_id in ev.get("ingredient_ids", []):
            event_multiplier = max(event_multiplier, float(ev.get("multiplier", 1.0)))

    # 4. Forecast rule:
    # When an unexpected demand surge (spike) occurs, standard moving averages
    # lag behind because they average in older pre-spike data. Basing the forecast
    # on the recent 2-day surge average allows the system to react instantly to the spike
    # and order sufficient replenishment stock before inventory is exhausted.
    # If no spike, we use the standard 7-day moving average with weekday adjustments.
    if spike_info["is_spike"]:
        # When an unexpected demand surge (spike) occurs, standard moving averages
        # lag behind because they average in older pre-spike data. Basing the forecast
        # on the recent 2-day surge average allows the system to react instantly to the spike
        # and order sufficient replenishment stock before inventory is exhausted.
        daily_forecast = spike_info["recent_avg"] * event_multiplier
        forecast_7 = [round(daily_forecast, 1)] * 7
    else:
        # Under normal conditions without an anomalous spike, we project the 7-day future
        # demand curve using Person A's forecasting engine with weekday adjustments.
        # The daily planning rate is anchored to the 14-day baseline average (scaled by any active
        # event multiplier), matching the baseline buffer stock design so the shop starts and resets green.
        forecast_7 = forecast_demand(history_units, days_ahead=7, event_multiplier=event_multiplier)
        mean_14d = sum(history_units[-14:]) / 14.0 if len(history_units) >= 14 else (sum(history_units) / len(history_units) if history_units else 100.0)
        daily_forecast = mean_14d * event_multiplier

    # 5. Standard deviation: baseline standard deviation from spike detector
    std = spike_info["baseline_std"] if spike_info["baseline_std"] > 0 else 10.0

    # 6. Reorder calculation
    reorder_res = calculate_reorder(
        daily_forecast=daily_forecast,
        std=std,
        lead_time_days=lead_time,
        cover_days=cover_days,
        current_stock=stock,
    )

    return {
        "ingredient": ing,
        "daily_forecast": round(daily_forecast, 1),
        "forecast_7": [round(x, 1) for x in forecast_7],
        "spike_info": spike_info,
        "reorder_res": reorder_res,
        "history_rows": sales_rows,
    }


# ---------------------------------------------------------------------------
# API Endpoints (docs/contract.md)
# ---------------------------------------------------------------------------
@app.get("/")
def read_root():
    return {
        "message": "Potion Pantry API is alive!",
        "role": "Person B - The Engine",
        "status": "ready",
        "version": "1.0.0",
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/api/ingredients")
def list_ingredients():
    """
    List all 6 ingredients with current stock, lead time, daily forecast,
    days of cover, reorder recommendation, and status.
    """
    ingredients = get_ingredients()
    active_events = get_active_events()
    results = []

    for ing in ingredients:
        state = compute_ingredient_state(ing, active_events)
        reorder = state["reorder_res"]

        results.append({
            "id": ing["id"],
            "name": ing["name"],
            "current_stock": ing["current_stock"],
            "lead_time_days": ing["lead_time_days"],
            "daily_forecast": state["daily_forecast"],
            "days_of_cover": reorder["days_of_cover"],
            "status": reorder["status"],
            "order_qty": reorder["order_qty"],
            "priority": reorder["priority"],
        })

    return results


@app.get("/api/forecast/{ingredient_id}")
def get_forecast(ingredient_id: int):
    """
    Returns 30-day historical sales, 7-day future forecast, and spike detection metadata.
    """
    ingredients = get_ingredients()
    target_ing = next((i for i in ingredients if i["id"] == ingredient_id), None)
    if not target_ing:
        raise HTTPException(status_code=404, detail=f"Ingredient with ID {ingredient_id} not found")

    active_events = get_active_events()
    state = compute_ingredient_state(target_ing, active_events)

    # Historical 30 days
    recent_30 = state["history_rows"][-30:] if len(state["history_rows"]) >= 30 else state["history_rows"]
    history_data = [{"date": r["date"], "units": r["units"]} for r in recent_30]

    # Future 7 days dates
    last_date_str = recent_30[-1]["date"] if recent_30 else "2024-01-01"
    last_date = datetime.strptime(last_date_str, "%Y-%m-%d")

    std = state["spike_info"]["baseline_std"]
    forecast_data = []
    for day_offset, fc_units in enumerate(state["forecast_7"], start=1):
        fc_date = (last_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        forecast_data.append({
            "date": fc_date,
            "units": fc_units,
            "lower": round(max(0.0, fc_units - std), 1),
            "upper": round(fc_units + std, 1),
        })

    return {
        "ingredient_id": target_ing["id"],
        "name": target_ing["name"],
        "history": history_data,
        "forecast": forecast_data,
        "spike": state["spike_info"],
    }


@app.get("/api/reorders")
def get_reorder_recommendations():
    """
    Returns current reorder suggestions, sorted with the most urgent items first:
    Critical first, then Watch, then OK; tie-broken by lowest days of cover.
    """
    ingredients = get_ingredients()
    active_events = get_active_events()
    reorders = []

    priority_weight = {"critical": 1, "watch": 2, "ok": 3}

    for ing in ingredients:
        state = compute_ingredient_state(ing, active_events)
        reorder = state["reorder_res"]

        reorders.append({
            "ingredient_id": ing["id"],
            "name": ing["name"],
            "needed": reorder["target_stock"],
            "in_stock": ing["current_stock"],
            "order_qty": reorder["order_qty"],
            "priority": reorder["priority"],
            "status": reorder["status"],
            "stockout_in_days": reorder["days_of_cover"],
        })

    # Sort: critical first, then lowest days of cover
    reorders.sort(key=lambda r: (priority_weight.get(r["status"], 4), r["stockout_in_days"]))
    return reorders


@app.post("/api/event")
def announce_event(event: EventAnnouncement):
    """
    Announces an upcoming festival or demand event. Saves in events table
    and dynamically recalculates forecasts.
    """
    event_id = insert_event(
        name=event.name,
        ingredient_ids=event.ingredient_ids,
        multiplier=event.multiplier,
        start_date=event.start_date,
        end_date=event.end_date,
    )

    ingredients = list_ingredients()
    return {
        "message": f"Event '{event.name}' recorded successfully with multiplier {event.multiplier}x",
        "event_id": event_id,
        "ingredients": ingredients,
    }


@app.post("/api/simulate-spike")
def simulate_spike():
    """
    Simulates a sudden festival demand surge by appending 2 days of 3x sales
    for ingredients 1, 2, and 3 past the latest dataset date.
    The spike detector automatically detects this surge on subsequent queries.
    """
    conn = get_connection()
    with conn:
        cursor = conn.cursor()

        # Find the latest base date
        cursor.execute("SELECT MAX(date) AS max_date FROM sales WHERE date <= '2024-01-01';")
        res = cursor.fetchone()
        base_date_str = res["max_date"] if (res and res["max_date"]) else "2024-01-01"
        base_date = datetime.strptime(base_date_str, "%Y-%m-%d")

        spike_date_1 = (base_date + timedelta(days=1)).strftime("%Y-%m-%d")
        spike_date_2 = (base_date + timedelta(days=2)).strftime("%Y-%m-%d")

        # Inject 3x sales for ingredients 1, 2, 3
        for ing_id in [1, 2, 3]:
            # Get 14-day mean sales
            cursor.execute(
                """
                SELECT AVG(units) as avg_units
                FROM (
                    SELECT units
                    FROM sales
                    WHERE ingredient_id = ? AND date <= '2024-01-01'
                    ORDER BY date DESC
                    LIMIT 14
                );
                """,
                (ing_id,),
            )
            row = cursor.fetchone()
            avg_14d = row["avg_units"] if (row and row["avg_units"]) else 600.0
            spiked_units = int(math.ceil(avg_14d * 3.0))

            cursor.execute(
                "INSERT OR REPLACE INTO sales (date, ingredient_id, units) VALUES (?, ?, ?);",
                (spike_date_1, ing_id, spiked_units),
            )
            cursor.execute(
                "INSERT OR REPLACE INTO sales (date, ingredient_id, units) VALUES (?, ?, ?);",
                (spike_date_2, ing_id, spiked_units),
            )

    conn.close()

    updated_ingredients = list_ingredients()
    updated_reorders = get_reorder_recommendations()

    return {
        "message": "Full Moon Festival spike simulated! Ingredients 1, 2, and 3 demand surged by 3x.",
        "affected_ingredients": [1, 2, 3],
        "ingredients": updated_ingredients,
        "reorders": updated_reorders,
    }


@app.post("/api/reset")
def reset_demo():
    """
    Restores the demo back to baseline state:
    1. Removes all simulated spike rows from the sales table (date > '2024-01-01').
    2. Calls reset_state() to clear events, clear reorders, and restore green buffer stock.
    """
    conn = get_connection()
    with conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM sales WHERE date > '2024-01-01';")
    conn.close()

    # Reset events, reorders, and restore green buffer stock
    reset_state()

    return {
        "status": "ok",
        "message": "Demo data reset to baseline",
    }
