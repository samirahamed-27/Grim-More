from datetime import date, timedelta
from typing import List, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

app = FastAPI(
    title="Potion Pantry API",
    description="Track 01: Inventory prediction for a sudden festival demand spike",
    version="0.1.0"
)

# Enable CORS so frontend (Person C) can connect from anywhere (e.g., http://localhost:3000, 127.0.0.1, or file://)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
# Mock Data Store (Contract-compliant for Phase 1 Person C Unblocking)
# ---------------------------------------------------------------------------
def get_mock_ingredients(spike_active: bool = False):
    if not spike_active:
        return [
            {
                "id": 1,
                "name": "Moonflower",
                "current_stock": 400,
                "lead_time_days": 2,
                "daily_forecast": 100,
                "days_of_cover": 4.0,
                "status": "ok",
                "order_qty": 123,
                "priority": "low"
            },
            {
                "id": 2,
                "name": "Silver Dew",
                "current_stock": 800,
                "lead_time_days": 1,
                "daily_forecast": 200,
                "days_of_cover": 4.0,
                "status": "ok",
                "order_qty": 146,
                "priority": "low"
            },
            {
                "id": 3,
                "name": "Wolfsbane",
                "current_stock": 200,
                "lead_time_days": 3,
                "daily_forecast": 50,
                "days_of_cover": 4.0,
                "status": "ok",
                "order_qty": 123,
                "priority": "low"
            },
            {
                "id": 4,
                "name": "Dragon Resin",
                "current_stock": 300,
                "lead_time_days": 4,
                "daily_forecast": 60,
                "days_of_cover": 5.0,
                "status": "ok",
                "order_qty": 208,
                "priority": "low"
            },
            {
                "id": 5,
                "name": "Nightshade",
                "current_stock": 500,
                "lead_time_days": 2,
                "daily_forecast": 120,
                "days_of_cover": 4.2,
                "status": "ok",
                "order_qty": 130,
                "priority": "low"
            },
            {
                "id": 6,
                "name": "Mandrake Root",
                "current_stock": 150,
                "lead_time_days": 3,
                "daily_forecast": 40,
                "days_of_cover": 3.75,
                "status": "ok",
                "order_qty": 102,
                "priority": "low"
            }
        ]
    else:
        # Full Moon Festival demand spike active for IDs 1, 2, 3!
        return [
            {
                "id": 1,
                "name": "Moonflower",
                "current_stock": 400,
                "lead_time_days": 2,
                "daily_forecast": 300,
                "days_of_cover": 1.3,
                "status": "critical",
                "order_qty": 1170,
                "priority": "high"
            },
            {
                "id": 2,
                "name": "Silver Dew",
                "current_stock": 800,
                "lead_time_days": 1,
                "daily_forecast": 600,
                "days_of_cover": 1.3,
                "status": "watch",
                "order_qty": 1700,
                "priority": "high"
            },
            {
                "id": 3,
                "name": "Wolfsbane",
                "current_stock": 200,
                "lead_time_days": 3,
                "daily_forecast": 150,
                "days_of_cover": 1.3,
                "status": "critical",
                "order_qty": 780,
                "priority": "high"
            },
            {
                "id": 4,
                "name": "Dragon Resin",
                "current_stock": 300,
                "lead_time_days": 4,
                "daily_forecast": 60,
                "days_of_cover": 5.0,
                "status": "ok",
                "order_qty": 208,
                "priority": "low"
            },
            {
                "id": 5,
                "name": "Nightshade",
                "current_stock": 500,
                "lead_time_days": 2,
                "daily_forecast": 120,
                "days_of_cover": 4.2,
                "status": "ok",
                "order_qty": 130,
                "priority": "low"
            },
            {
                "id": 6,
                "name": "Mandrake Root",
                "current_stock": 150,
                "lead_time_days": 3,
                "daily_forecast": 40,
                "days_of_cover": 3.75,
                "status": "ok",
                "order_qty": 102,
                "priority": "low"
            }
        ]

# Simple in-memory flag for mock toggle until DB is wired in B4
_state = {"spike_active": False, "announced_event": None}


# ---------------------------------------------------------------------------
# API Endpoints (docs/contract.md)
# ---------------------------------------------------------------------------

@app.get("/")
def read_root():
    return {
        "message": "Potion Pantry API is alive!",
        "role": "Person B - The Engine",
        "status": "ready"
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/ingredients")
def get_ingredients():
    """
    List all ingredients with stock, daily forecast, days of cover, and status.
    """
    return get_mock_ingredients(spike_active=_state["spike_active"])

@app.get("/api/forecast/{ingredient_id}")
def get_forecast(ingredient_id: int):
    """
    Returns 30 days of sales history, 7 days of forecast with uncertainty bands,
    and spike detection metrics for the specified ingredient.
    """
    ingredients = {item["id"]: item for item in get_mock_ingredients(_state["spike_active"])}
    if ingredient_id not in ingredients:
        raise HTTPException(status_code=404, detail=f"Ingredient with ID {ingredient_id} not found")

    target = ingredients[ingredient_id]
    is_spike_item = ingredient_id in [1, 2, 3] and _state["spike_active"]
    base_val = 100 if ingredient_id == 1 else (200 if ingredient_id == 2 else 50)
    
    # Generate 30 days of realistic history
    today = date(2026, 10, 31)
    history = []
    for i in range(30, 0, -1):
        day = today - timedelta(days=i)
        # Slight variation around base
        units = int(base_val + ((i % 5) - 2) * 4)
        if is_spike_item and i <= 2:
            units = units * 3  # Last 2 days jumped 3x!
        history.append({"date": day.isoformat(), "units": units})

    # Generate 7 days of forecast
    forecast = []
    mult = 3.0 if is_spike_item else 1.0
    forecast_val = base_val * mult
    std = 10 * mult
    for i in range(1, 8):
        day = today + timedelta(days=i)
        forecast.append({
            "date": day.isoformat(),
            "units": round(forecast_val, 1),
            "lower": round(max(0, forecast_val - std), 1),
            "upper": round(forecast_val + std, 1)
        })

    spike_info = {
        "is_spike": is_spike_item,
        "z_score": 18.5 if is_spike_item else 0.4,
        "baseline_avg": float(base_val),
        "baseline_std": 10.0,
        "recent_avg": float(base_val * 3 if is_spike_item else base_val + 2)
    }

    return {
        "ingredient_id": target["id"],
        "name": target["name"],
        "history": history,
        "forecast": forecast,
        "spike": spike_info
    }

@app.post("/api/event")
def announce_event(event: EventAnnouncement):
    """
    Announce an upcoming festival or demand event.
    """
    _state["announced_event"] = event.model_dump()
    _state["spike_active"] = True
    return {
        "message": f"Event '{event.name}' recorded successfully. Multiplier {event.multiplier} applied to items {event.ingredient_ids}.",
        "event": event,
        "ingredients": get_mock_ingredients(spike_active=True)
    }

@app.post("/api/simulate-spike")
def simulate_spike():
    """
    Demo trigger: Simulates a sudden demand surge for ingredients 1, 2, and 3.
    """
    _state["spike_active"] = True
    ingredients = get_mock_ingredients(spike_active=True)
    
    # Generate urgent reorder table
    reorders = [
        {
            "ingredient_id": 1,
            "name": "Moonflower",
            "needed": 1570,
            "in_stock": 400,
            "order_qty": 1170,
            "priority": "high",
            "status": "critical",
            "stockout_in_days": 1.3
        },
        {
            "ingredient_id": 3,
            "name": "Wolfsbane",
            "needed": 980,
            "in_stock": 200,
            "order_qty": 780,
            "priority": "high",
            "status": "critical",
            "stockout_in_days": 1.3
        },
        {
            "ingredient_id": 2,
            "name": "Silver Dew",
            "needed": 2500,
            "in_stock": 800,
            "order_qty": 1700,
            "priority": "high",
            "status": "watch",
            "stockout_in_days": 1.3
        }
    ]

    return {
        "message": "Full Moon Festival spike simulated! Ingredients 1, 2, and 3 demand surged by 3x.",
        "affected_ingredients": [1, 2, 3],
        "ingredients": ingredients,
        "reorders": reorders
    }

@app.get("/api/reorders")
def get_reorders():
    """
    Returns current reorder recommendations sorted with most urgent first.
    """
    if _state["spike_active"]:
        return [
            {
                "ingredient_id": 1,
                "name": "Moonflower",
                "needed": 1570,
                "in_stock": 400,
                "order_qty": 1170,
                "priority": "high",
                "status": "critical",
                "stockout_in_days": 1.3
            },
            {
                "ingredient_id": 3,
                "name": "Wolfsbane",
                "needed": 980,
                "in_stock": 200,
                "order_qty": 780,
                "priority": "high",
                "status": "critical",
                "stockout_in_days": 1.3
            },
            {
                "ingredient_id": 2,
                "name": "Silver Dew",
                "needed": 2500,
                "in_stock": 800,
                "order_qty": 1700,
                "priority": "high",
                "status": "watch",
                "stockout_in_days": 1.3
            },
            {
                "ingredient_id": 4,
                "name": "Dragon Resin",
                "needed": 508,
                "in_stock": 300,
                "order_qty": 208,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 5.0
            },
            {
                "ingredient_id": 5,
                "name": "Nightshade",
                "needed": 630,
                "in_stock": 500,
                "order_qty": 130,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 4.2
            },
            {
                "ingredient_id": 6,
                "name": "Mandrake Root",
                "needed": 252,
                "in_stock": 150,
                "order_qty": 102,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 3.75
            }
        ]
    else:
        return [
            {
                "ingredient_id": 1,
                "name": "Moonflower",
                "needed": 523,
                "in_stock": 400,
                "order_qty": 123,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 4.0
            },
            {
                "ingredient_id": 2,
                "name": "Silver Dew",
                "needed": 946,
                "in_stock": 800,
                "order_qty": 146,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 4.0
            },
            {
                "ingredient_id": 3,
                "name": "Wolfsbane",
                "needed": 323,
                "in_stock": 200,
                "order_qty": 123,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 4.0
            },
            {
                "ingredient_id": 4,
                "name": "Dragon Resin",
                "needed": 508,
                "in_stock": 300,
                "order_qty": 208,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 5.0
            },
            {
                "ingredient_id": 5,
                "name": "Nightshade",
                "needed": 630,
                "in_stock": 500,
                "order_qty": 130,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 4.2
            },
            {
                "ingredient_id": 6,
                "name": "Mandrake Root",
                "needed": 252,
                "in_stock": 150,
                "order_qty": 102,
                "priority": "low",
                "status": "ok",
                "stockout_in_days": 3.75
            }
        ]

@app.post("/api/reset")
def reset_demo():
    """
    Puts the demo back to normal baseline state.
    """
    _state["spike_active"] = False
    _state["announced_event"] = None
    return {
        "status": "ok",
        "message": "Demo data reset to baseline"
    }
