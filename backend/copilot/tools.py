"""
Potion Pantry - Copilot Tool Declarations & Execution Engine (backend/copilot/tools.py)

Defines JSON schemas, input validation, and execution wrappers for:
- 8 Read-Only Tools (executed automatically by agent loop without HTTP self-calls):
  1. get_inventory_status
  2. get_alerts
  3. get_reorders
  4. get_forecast
  5. get_upcoming_festivals
  6. get_simulation
  7. check_runout_before (NEW read-only what-if helper)
  8 whatif_supplier_delay (NEW read-only what-if helper)
- 4 Mutating Tools (NEVER executed directly; create single-use pending actions):
  1. simulate_surge
  2. announce_event
  3. record_sale
  4. reset_demo
"""

import math
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Union

from backend.db import (
    get_connection,
    get_ingredients,
    get_recent_sales,
    get_active_events,
    get_latest_sales_date,
    insert_event,
    record_sale as db_record_sale,
    reset_state,
)
from backend.forecasting import forecast_demand
from backend.spike import detect_spike
from backend.reorder import calculate_reorder
from backend.moon_calendar import get_upcoming_full_moons


# ---------------------------------------------------------------------------
# Strict Tool JSON Schemas (for Gemini Function Calling)
# ---------------------------------------------------------------------------
TOOL_DECLARATIONS = [
    {
        "name": "get_inventory_status",
        "description": "Fetch current stock, daily forecast, days of cover, reorder quantity, and status (ok, watch, critical) for all 6 potion shop ingredients.",
        "parameters": {
            "type": "OBJECT",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_alerts",
        "description": "Fetch all active plain-English alerts for ingredients requiring attention (critical/watch items, unannounced spikes, or upcoming festival deadlines). Returns empty list if all green.",
        "parameters": {
            "type": "OBJECT",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_reorders",
        "description": "Fetch prioritized reorder recommendations sorted by urgency (critical first, lowest days of cover).",
        "parameters": {
            "type": "OBJECT",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "get_forecast",
        "description": "Fetch 30-day historical sales, forward daily forecast, and spike detection metadata for a specific ingredient ID (1-6).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "ingredient_id": {
                    "type": "INTEGER",
                    "description": "Ingredient ID (1 to 6).",
                },
                "days": {
                    "type": "INTEGER",
                    "description": "Number of future forecast days to return (1 to 14, default 7).",
                },
            },
            "required": ["ingredient_id"],
        },
    },
    {
        "name": "get_upcoming_festivals",
        "description": "Fetch astronomical full moons and festival surge dates within the upcoming planning window from demo_today, including lead-time order-by deadlines.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "days": {
                    "type": "INTEGER",
                    "description": "Planning horizon in days (1 to 60, default 30).",
                },
            },
            "required": [],
        },
    },
    {
        "name": "get_simulation",
        "description": "Run forward 14-day simulation comparing do-nothing, order-now, and proactive order-ahead scenarios for a specific ingredient ID (1-6).",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "ingredient_id": {
                    "type": "INTEGER",
                    "description": "Ingredient ID (1 to 6).",
                },
            },
            "required": ["ingredient_id"],
        },
    },
    {
        "name": "check_runout_before",
        "description": "Evaluate forward day-by-day depletion to determine whether and exactly when ingredients run out before a specified target date (YYYY-MM-DD), assuming no replenishment orders.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "date": {
                    "type": "STRING",
                    "description": "Target date in ISO format YYYY-MM-DD to check runout against.",
                },
            },
            "required": ["date"],
        },
    },
    {
        "name": "whatif_supplier_delay",
        "description": "Simulate what happens if a supplier delivery is delayed by additional days. Evaluates reorder status, days of cover, and stockouts without changing database records.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "ingredient_id": {
                    "type": "STRING",
                    "description": "Ingredient ID (1-6) or 'all' to simulate across all ingredients.",
                },
                "extra_lead_days": {
                    "type": "INTEGER",
                    "description": "Number of extra supplier delay days (1 to 14).",
                },
            },
            "required": ["extra_lead_days"],
        },
    },
    # Mutating Tools
    {
        "name": "simulate_surge",
        "description": "Simulate a sudden unannounced 3x festival surge for ingredients 1, 2, and 3. Requires explicit user confirmation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {},
            "required": [],
        },
    },
    {
        "name": "announce_event",
        "description": "Announce an upcoming festival event with custom date range and multiplier. Requires explicit user confirmation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "name": {"type": "STRING", "description": "Festival name"},
                "ingredient_ids": {
                    "type": "ARRAY",
                    "items": {"type": "INTEGER"},
                    "description": "List of affected ingredient IDs (1-6)",
                },
                "multiplier": {"type": "NUMBER", "description": "Demand multiplier (e.g. 2.0 or 3.0)"},
                "start_date": {"type": "STRING", "description": "Start date (YYYY-MM-DD)"},
                "end_date": {"type": "STRING", "description": "End date (YYYY-MM-DD)"},
            },
            "required": ["name", "ingredient_ids", "multiplier", "start_date", "end_date"],
        },
    },
    {
        "name": "record_sale",
        "description": "Record daily sales units for an ingredient at the sales input door. Requires explicit user confirmation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {
                "ingredient_id": {"type": "INTEGER", "description": "Ingredient ID (1-6)"},
                "date": {"type": "STRING", "description": "Sales date (YYYY-MM-DD)"},
                "units": {"type": "INTEGER", "description": "Units sold (>= 0)"},
            },
            "required": ["ingredient_id", "date", "units"],
        },
    },
    {
        "name": "reset_demo",
        "description": "Reset demo database back to clean baseline state (clears simulated surges, events, and reorders). Requires explicit user confirmation.",
        "parameters": {
            "type": "OBJECT",
            "properties": {},
            "required": [],
        },
    },
]

MUTATING_TOOL_NAMES = {"simulate_surge", "announce_event", "record_sale", "reset_demo"}
READ_ONLY_TOOL_NAMES = {d["name"] for d in TOOL_DECLARATIONS if d["name"] not in MUTATING_TOOL_NAMES}


# ---------------------------------------------------------------------------
# Internal Helper: Demo Reference Date
# ---------------------------------------------------------------------------
def get_demo_today_str() -> str:
    """Returns demo today string: exactly 1 day after the latest date in sales history."""
    latest = get_latest_sales_date()
    latest_dt = datetime.strptime(latest, "%Y-%m-%d")
    return (latest_dt + timedelta(days=1)).strftime("%Y-%m-%d")


# ---------------------------------------------------------------------------
# Read-Only Tool Execution Implementations
# ---------------------------------------------------------------------------
def execute_get_inventory_status() -> List[Dict[str, Any]]:
    """Calls backend list_ingredients logic without HTTP roundtrip."""
    from backend.main import list_ingredients
    return list_ingredients()


def execute_get_alerts() -> List[Dict[str, Any]]:
    """Calls backend get_alerts logic without HTTP roundtrip."""
    from backend.main import get_alerts
    return get_alerts()


def execute_get_reorders() -> List[Dict[str, Any]]:
    """Calls backend get_reorder_recommendations logic without HTTP roundtrip."""
    from backend.main import get_reorder_recommendations
    return get_reorder_recommendations()


def execute_get_forecast(ingredient_id: int, days: int = 7) -> Dict[str, Any]:
    """Calls backend get_forecast logic and slices to requested days (1-14)."""
    from backend.main import get_forecast
    if not isinstance(ingredient_id, int) or ingredient_id < 1 or ingredient_id > 6:
        raise ValueError(f"Invalid ingredient_id {ingredient_id}. Must be between 1 and 6.")
    days_clamped = max(1, min(14, int(days)))
    res = get_forecast(ingredient_id)
    res["forecast"] = res["forecast"][:days_clamped]
    return res


def execute_get_upcoming_festivals(days: int = 30) -> List[Dict[str, Any]]:
    """Calls backend calendar logic for upcoming full moons."""
    from backend.main import get_upcoming_calendar
    days_clamped = max(1, min(60, int(days)))
    return get_upcoming_calendar(days=days_clamped)


def execute_get_simulation(ingredient_id: int) -> Dict[str, Any]:
    """Calls backend simulate_ingredient_stock logic."""
    from backend.main import simulate_ingredient_stock
    if not isinstance(ingredient_id, int) or ingredient_id < 1 or ingredient_id > 6:
        raise ValueError(f"Invalid ingredient_id {ingredient_id}. Must be between 1 and 6.")
    return simulate_ingredient_stock(ingredient_id)


def execute_check_runout_before(date_str: str) -> Dict[str, Any]:
    """
    Evaluates forward day-by-day stock depletion against target date (YYYY-MM-DD).
    Strictly read-only; documents assumptions (no new replenishment orders).
    """
    try:
        target_dt = datetime.strptime(date_str, "%Y-%m-%d")
        if target_dt.strftime("%Y-%m-%d") != date_str:
            raise ValueError()
    except (ValueError, TypeError):
        raise ValueError(f"Invalid target date format '{date_str}'. Expected ISO YYYY-MM-DD.")

    demo_today_str = get_demo_today_str()
    demo_today_dt = datetime.strptime(demo_today_str, "%Y-%m-%d")

    from backend.main import compute_ingredient_state
    ingredients = get_ingredients()
    active_events = get_active_events()

    days_to_target = (target_dt - demo_today_dt).days
    eval_horizon = max(14, days_to_target + 7)  # evaluate up to target + 7 days

    results = []
    runout_count = 0

    for ing in ingredients:
        state = compute_ingredient_state(ing, active_events, log_audit=False)
        forecast_14 = dict(state["forecast_14"])
        baseline_rate = (
            state["spike_info"]["baseline_avg"]
            if state["spike_info"]["baseline_avg"] > 0
            else state["daily_forecast"]
        )

        current_stock = ing["current_stock"]
        curr_level = float(current_stock)
        runout_date = None
        runout_day_num = None

        for day_offset in range(1, eval_horizon + 1):
            day_dt = demo_today_dt + timedelta(days=day_offset - 1)
            day_date_str = day_dt.strftime("%Y-%m-%d")

            demand = forecast_14.get(day_date_str, baseline_rate)
            if curr_level - demand < 0:
                runout_date = day_date_str
                runout_day_num = day_offset
                break
            curr_level -= demand

        runs_out_before = runout_date is not None and runout_date <= date_str
        if runs_out_before:
            runout_count += 1

        results.append({
            "ingredient_id": ing["id"],
            "name": ing["name"],
            "current_stock": current_stock,
            "daily_forecast": state["daily_forecast"],
            "days_of_cover": state["reorder_res"]["days_of_cover"],
            "status": state["reorder_res"]["status"],
            "runs_out_before": runs_out_before,
            "runout_date": runout_date,
            "days_until_runout": runout_day_num,
        })

    # Plain English summary
    if runout_count == 0:
        summary = (
            f"No ingredients will run out before {date_str}. All 6 ingredients have sufficient "
            f"stock through that date based on current forecast demand."
        )
    else:
        critical_names = [r["name"] for r in results if r["runs_out_before"]]
        summary = (
            f"{runout_count} ingredient(s) ({', '.join(critical_names)}) will run out before {date_str} "
            f"without new replenishment orders."
        )

    return {
        "target_date": date_str,
        "demo_today": demo_today_str,
        "assumptions": "Assumes no new replenishment orders are placed and sales follow forecast demand.",
        "ingredients_running_out_count": runout_count,
        "ingredients": results,
        "summary": summary,
    }


def execute_whatif_supplier_delay(
    ingredient_id: Union[int, str] = "all",
    extra_lead_days: int = 1,
) -> Dict[str, Any]:
    """
    Pure in-memory simulation of supplier delivery delays.
    MUST NOT write to SQLite or modify ingredients table.
    """
    if not isinstance(extra_lead_days, int) or extra_lead_days < 1 or extra_lead_days > 14:
        raise ValueError(f"extra_lead_days must be an integer between 1 and 14. Got {extra_lead_days}.")

    from backend.main import compute_ingredient_state
    ingredients = get_ingredients()
    active_events = get_active_events()

    # Determine target ingredients
    if str(ingredient_id).lower() == "all":
        targets = ingredients
    else:
        try:
            target_id_int = int(ingredient_id)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid ingredient_id '{ingredient_id}'. Must be 1-6 or 'all'.")
        targets = [i for i in ingredients if i["id"] == target_id_int]
        if not targets:
            raise ValueError(f"Ingredient ID {ingredient_id} not found (valid range 1-6).")

    results = []
    stockout_ingredients = []

    for ing in targets:
        # Base state with zero audit logging
        base_state = compute_ingredient_state(ing, active_events, log_audit=False)
        orig_lt = ing["lead_time_days"]
        delayed_lt = orig_lt + extra_lead_days
        cover_days = ing["cover_days"]
        stock = ing["current_stock"]
        daily_fc = base_state["daily_forecast"]
        std = (
            base_state["spike_info"]["baseline_std"]
            if base_state["spike_info"]["baseline_std"] > 0
            else 10.0
        )

        # Recompute planning forecast and target stock under delayed lead time
        planning_window = max(1, delayed_lt + cover_days)
        reorder_delayed = calculate_reorder(
            daily_forecast=base_state["planning_forecast"],
            std=std,
            lead_time_days=delayed_lt,
            cover_days=cover_days,
            current_stock=stock,
        )

        raw_doc = stock / daily_fc if daily_fc > 0 else 999.0
        # Determine delayed urgency status
        if raw_doc < float(delayed_lt):
            delayed_status = "critical"
            delayed_priority = "high"
        elif raw_doc < float(delayed_lt + 2):
            delayed_status = "watch"
            delayed_priority = "medium"
        else:
            delayed_status = "ok"
            delayed_priority = "low"

        # Simulate forward trajectory until delayed arrival day to test if stockout occurs
        # Evaluation: Morning -> Demand -> Delivery
        curr_stock = stock
        stockout_day = None
        total_shortage = 0
        for day_num, (_, demand) in enumerate(base_state["forecast_14"], start=1):
            if day_num > delayed_lt:
                break
            stock_after_demand = curr_stock - demand
            if stock_after_demand < 0:
                if stockout_day is None:
                    stockout_day = day_num
                total_shortage += abs(stock_after_demand)
                curr_stock = 0.0
            else:
                curr_stock = stock_after_demand

        stockout_occurs = stockout_day is not None and stockout_day <= delayed_lt
        if stockout_occurs:
            stockout_ingredients.append(ing["name"])

        results.append({
            "ingredient_id": ing["id"],
            "name": ing["name"],
            "original_lead_time_days": orig_lt,
            "delayed_lead_time_days": delayed_lt,
            "extra_delay_days": extra_lead_days,
            "current_stock": stock,
            "daily_forecast": daily_fc,
            "days_of_cover": base_state["reorder_res"]["days_of_cover"],
            "original_status": base_state["reorder_res"]["status"],
            "delayed_status": delayed_status,
            "original_order_qty": base_state["reorder_res"]["order_qty"],
            "delayed_order_qty": reorder_delayed["order_qty"],
            "stockout_occurs": stockout_occurs,
            "stockout_day": stockout_day,
            "units_short": int(round(total_shortage)),
        })

    # Summary
    if len(results) == 1:
        res = results[0]
        name = res["name"]
        if res["stockout_occurs"]:
            summary = (
                f"A {extra_lead_days}-day delay pushes {name}'s lead time to {res['delayed_lead_time_days']} days, "
                f"causing a stockout on day {res['stockout_day']} ({res['units_short']:,} units short). "
                f"Status changes from {res['original_status']} to {res['delayed_status']}. "
                f"Required replenishment increases to {res['delayed_order_qty']:,} units."
            )
        else:
            summary = (
                f"A {extra_lead_days}-day delay extends {name}'s lead time from {res['original_lead_time_days']} to {res['delayed_lead_time_days']} days. "
                f"With {res['days_of_cover']:.1f} days of cover, inventory survives without a stockout, but status becomes {res['delayed_status']}. "
                f"Recommended order quantity increases to {res['delayed_order_qty']:,} units."
            )
    else:
        if stockout_ingredients:
            summary = (
                f"A {extra_lead_days}-day supplier delay causes stockouts for {len(stockout_ingredients)} ingredient(s): "
                f"{', '.join(stockout_ingredients)}. Order quantities and status urgency increase across the shop."
            )
        else:
            summary = (
                f"A {extra_lead_days}-day supplier delay causes no immediate stockouts, but increases required replenishment "
                f"and shifts inventory buffers closer to supplier lead times."
            )

    return {
        "extra_lead_days": extra_lead_days,
        "target": "all" if str(ingredient_id).lower() == "all" else results[0]["name"],
        "ingredients": results,
        "summary": summary,
    }


# ---------------------------------------------------------------------------
# Master Tool Dispatcher (Server-side validation & execution)
# ---------------------------------------------------------------------------
def execute_tool(name: str, args: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes a read-only tool by name with arguments.
    Raises ValueError on unknown tool or invalid arguments.
    Mutating tools cannot be executed through this function.
    """
    if name not in READ_ONLY_TOOL_NAMES:
        if name in MUTATING_TOOL_NAMES:
            raise ValueError(f"Tool '{name}' is mutating and cannot be executed directly.")
        raise ValueError(f"Unknown tool '{name}'. Valid tools: {sorted(list(READ_ONLY_TOOL_NAMES))}")

    if name == "get_inventory_status":
        return {"result": execute_get_inventory_status()}
    elif name == "get_alerts":
        return {"result": execute_get_alerts()}
    elif name == "get_reorders":
        return {"result": execute_get_reorders()}
    elif name == "get_forecast":
        ing_id = args.get("ingredient_id")
        days = args.get("days", 7)
        return {"result": execute_get_forecast(ingredient_id=ing_id, days=days)}
    elif name == "get_upcoming_festivals":
        days = args.get("days", 30)
        return {"result": execute_get_upcoming_festivals(days=days)}
    elif name == "get_simulation":
        ing_id = args.get("ingredient_id")
        return {"result": execute_get_simulation(ingredient_id=ing_id)}
    elif name == "check_runout_before":
        target_date = args.get("date")
        if not target_date:
            raise ValueError("check_runout_before requires 'date' parameter (YYYY-MM-DD).")
        return {"result": execute_check_runout_before(date_str=target_date)}
    elif name == "whatif_supplier_delay":
        extra_days = args.get("extra_lead_days")
        if extra_days is None:
            raise ValueError("whatif_supplier_delay requires 'extra_lead_days' parameter (integer 1-14).")
        ing_id = args.get("ingredient_id", "all")
        return {"result": execute_whatif_supplier_delay(ingredient_id=ing_id, extra_lead_days=int(extra_days))}
    else:
        raise ValueError(f"Tool '{name}' dispatch not implemented.")
