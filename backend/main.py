"""
Potion Pantry - FastAPI Production Engine (backend/main.py)
Connects SQLite database (db.py), forecasting engine (forecasting.py),
spike detector (spike.py), and reorder logic (reorder.py) into real REST endpoints.
Includes Phase 3 smart features: date-bounded festival forecasting, prioritized alerts,
day-by-day stockout simulation, and smart deduplicated reorder history tracking.
"""

import math
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from backend.db import (
    init_db,
    get_connection,
    get_ingredients,
    get_recent_sales,
    insert_event,
    get_active_events,
    record_reorder,
    get_latest_reorder,
    get_reorders,
    reset_state,
)
from backend.forecasting import forecast_demand
from backend.spike import detect_spike
from backend.reorder import calculate_reorder
from backend.routes.restock import router as restock_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ensures database tables exist and baseline CSV data is seeded on server start."""
    init_db()
    yield


# Initialize FastAPI application
app = FastAPI(
    title="Potion Pantry API",
    description="Track 01: Inventory prediction for a sudden festival demand spike",
    version="1.1.0",
    lifespan=lifespan,
)

# Restrict CORS to trusted frontend origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Format HTTP exceptions into standard error envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": str(exc.detail)},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Format input validation errors into standard error envelope."""
    first_err = exc.errors()[0]
    field = first_err.get("loc", ["parameter"])[-1]
    msg = first_err.get("msg", "Invalid value")
    return JSONResponse(
        status_code=422,
        content={"error": f"{field}: {msg}"},
    )


# Register modular routers
app.include_router(restock_router)
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
# Core Date & Demand Calculation Helpers (Phase 3: B5a)
# ---------------------------------------------------------------------------
def get_event_multiplier_for_date(
    date_str: str,
    ingredient_id: int,
    active_events: List[Dict[str, Any]],
) -> float:
    """
    Computes the date-bounded demand multiplier for an announced festival.
    Applies the multiplier strictly if date_str falls within [start_date, end_date]
    and the ingredient_id is affected. Defaults to 1.0.
    """
    multiplier = 1.0
    for ev in active_events:
        if ingredient_id in ev.get("ingredient_ids", []):
            start = ev.get("start_date", "")
            end = ev.get("end_date", "")
            if start <= date_str <= end:
                multiplier = max(multiplier, float(ev.get("multiplier", 1.0)))
    return multiplier


def compute_ingredient_state(
    ing: Dict[str, Any], active_events: List[Dict[str, Any]], log_audit: bool = True
) -> Dict[str, Any]:
    """
    Executes the full inventory evaluation pipeline for a single ingredient:
    DB Sales -> Spike Detection -> Date-bounded Festival Forecast -> Reorder Calculation.

    B5a Announcement Path:
    - Daily forecast for today reflects immediate demand rate so today's status badge remains accurate.
    - Forward planning forecast across [lead_time + cover_days] includes upcoming festival demand
      so replenishment orders are placed in advance before supplier delivery times cause shortages.
    """
    ing_id = ing["id"]
    stock = ing["current_stock"]
    lead_time = ing["lead_time_days"]
    cover_days = ing["cover_days"]

    # 1. Fetch sales history from database
    sales_rows = get_recent_sales(ing_id, days=90)
    history_units = [row["units"] for row in sales_rows]

    # Reference date (the most recent historical sales date)
    last_date_str = sales_rows[-1]["date"] if sales_rows else "2024-01-01"
    last_date = datetime.strptime(last_date_str, "%Y-%m-%d")

    # 2. Run statistical spike detector
    spike_info = detect_spike(history_units)

    # 3. Base demand rate from recent history
    if len(history_units) >= 14:
        mean_14d = sum(history_units[-14:]) / 14.0
    elif history_units:
        mean_14d = sum(history_units) / float(len(history_units))
    else:
        mean_14d = 100.0

    # 4. Compute 14-day forward daily demand with date-bounded multipliers
    # When an unannounced surge (spike) occurs, standard moving averages lag behind.
    # Basing the forecast on the recent 2-day surge average allows the system to react instantly.
    # If no spike, we use Person A's baseline engine and apply festival multipliers on event dates only.
    std = spike_info["baseline_std"] if spike_info["baseline_std"] > 0 else 10.0
    base_forecast_7 = forecast_demand(history_units, days_ahead=7) if len(history_units) >= 7 else [mean_14d] * 7

    forecast_14 = []
    for day_offset in range(1, 15):
        day_date_str = (last_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        event_mult = get_event_multiplier_for_date(day_date_str, ing_id, active_events)

        if spike_info["is_spike"]:
            # A sudden surprise festival surge (spike) elevates demand during the 3-day festival window,
            # after which demand normalizes back to steady baseline (baseline_avg).
            if day_offset <= 3:
                day_fc = spike_info["recent_avg"] * max(1.0, event_mult)
            else:
                day_fc = spike_info["baseline_avg"] * max(1.0, event_mult)
        else:
            base_val = base_forecast_7[(day_offset - 1) % len(base_forecast_7)]
            day_fc = base_val * event_mult

        forecast_14.append((day_date_str, round(day_fc, 1)))

    # Immediate forecast for day 1 (shown on ingredient card and used for days_of_cover)
    today_date_str = (last_date + timedelta(days=1)).strftime("%Y-%m-%d")
    today_mult = get_event_multiplier_for_date(today_date_str, ing_id, active_events)
    if spike_info["is_spike"]:
        daily_forecast_today = spike_info["recent_avg"] * max(1.0, today_mult)
    else:
        daily_forecast_today = mean_14d * today_mult

    # Planning forecast across the replenishment horizon (lead_time + cover_days)
    # Anchored to 14-day baseline so baseline stock starts and resets green,
    # scaling proportionately when an announced festival falls within the replenishment window.
    planning_window_days = max(1, lead_time + cover_days)
    sum_planning_mult = 0.0
    for day_offset in range(1, planning_window_days + 1):
        day_date_str = (last_date + timedelta(days=day_offset)).strftime("%Y-%m-%d")
        day_mult = get_event_multiplier_for_date(day_date_str, ing_id, active_events)
        sum_planning_mult += day_mult
    avg_planning_mult = sum_planning_mult / float(planning_window_days)

    if spike_info["is_spike"]:
        planning_daily_forecast = spike_info["recent_avg"] * max(1.0, avg_planning_mult)
    else:
        planning_daily_forecast = mean_14d * avg_planning_mult

    # 5. Reorder calculation using planning forecast and current stock
    reorder_res = calculate_reorder(
        daily_forecast=planning_daily_forecast,
        std=std,
        lead_time_days=lead_time,
        cover_days=cover_days,
        current_stock=stock,
    )

    # Re-evaluate days_of_cover against immediate daily demand rate
    # Status is strictly evaluated on unrounded days of cover (Task B3 contract rule)
    if daily_forecast_today > 0:
        raw_doc = stock / daily_forecast_today
        doc_display = round(raw_doc, 1)
        # Prevent misleading display where 1.998 rounds up to 2.0 while lead time is 2.0 and status is critical
        if raw_doc < float(lead_time) and doc_display >= float(lead_time):
            doc_display = round(float(lead_time) - 0.1, 1)
    else:
        raw_doc = 999.0
        doc_display = 999.0

    # Ensure status reflects immediate stockout urgency
    if raw_doc < float(lead_time):
        status = "critical"
        priority = "high"
    elif raw_doc < float(lead_time + 2):
        status = "watch"
        priority = "medium"
    else:
        status = "ok"
        priority = "low"

    reorder_res["days_of_cover"] = doc_display
    reorder_res["status"] = status
    reorder_res["priority"] = priority

    # 6. Smart Reorder Audit Logging (Task B6)
    # Deduplicates writes: only logs when order_qty > 0 and status or quantity changed
    if log_audit and reorder_res["order_qty"] > 0:
        latest = get_latest_reorder(ing_id)
        if (
            latest is None
            or latest["order_qty"] != reorder_res["order_qty"]
            or latest["priority"] != reorder_res["priority"]
        ):
            record_reorder(ing_id, reorder_res["order_qty"], reorder_res["priority"])

    return {
        "ingredient": ing,
        "daily_forecast": round(daily_forecast_today, 1),
        "planning_forecast": round(planning_daily_forecast, 1),
        "forecast_14": forecast_14,
        "forecast_7": [fc[1] for fc in forecast_14[:7]],
        "spike_info": spike_info,
        "reorder_res": reorder_res,
        "history_rows": sales_rows,
        "last_date": last_date,
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
        "version": "1.1.0",
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
    Returns 30-day historical sales, 7-day future forecast (with date-bounded festival multipliers),
    and spike detection metadata.
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

    # Future 7 days forecast array with date-bounded festival multiplier applied
    std = state["spike_info"]["baseline_std"]
    forecast_data = []
    for day_date_str, fc_units in state["forecast_14"][:7]:
        forecast_data.append({
            "date": day_date_str,
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


@app.get("/api/alerts")
def get_alerts():
    """
    Task B5b: Returns plain-English, actionable alerts for ingredients in 'critical' or 'watch' status.
    Sorted by urgency (critical first, lowest days of cover).
    Returns an empty list [] when all ingredients are healthy.
    Distinguishes unannounced sudden spikes from upcoming scheduled festival surges.
    """
    ingredients = get_ingredients()
    active_events = get_active_events()
    alerts = []

    priority_weight = {"critical": 1, "watch": 2}

    for ing in ingredients:
        state = compute_ingredient_state(ing, active_events, log_audit=False)
        reorder = state["reorder_res"]
        status = reorder["status"]
        spike = state["spike_info"]
        cover = reorder["days_of_cover"]
        lt = ing["lead_time_days"]
        qty = reorder["order_qty"]

        # Check if affected by an upcoming scheduled festival
        scheduled_event = None
        for ev in active_events:
            if ing["id"] in ev.get("ingredient_ids", []):
                scheduled_event = ev
                break

        # Emit alert if:
        # 1. Ingredient is critical or watch
        # 2. Or an unannounced spike is detected
        # 3. Or an upcoming festival is announced for this ingredient
        if status in ["critical", "watch"] or spike["is_spike"] or scheduled_event is not None:
            lt_str = "1 day" if lt == 1 else f"{lt} days"
            cover_str = "1 day" if cover == 1.0 else f"{cover:.1f} days"

            if spike["is_spike"]:
                alert_type = "spike"
                alert_status = status if status in ["critical", "watch"] else "critical"
                priority = reorder["priority"] if reorder["priority"] in ["high", "medium"] else "high"
                message = (
                    f"⚠️ UNANNOUNCED SPIKE DETECTED: {ing['name']} demand jumped to {state['daily_forecast']:.0f} units/day. "
                    f"Stock runs out in {cover_str}. Supplier delivery takes {lt_str}. "
                    f"Order {qty:,} units immediately to avoid a stockout."
                )
            elif scheduled_event is not None:
                alert_type = "festival"
                fest_mult = float(scheduled_event.get("multiplier", 1.0))
                fest_order_qty = qty if qty > 0 else int(round(state["daily_forecast"] * (lt + ing["cover_days"]) * (fest_mult - 1.0)))
                alert_status = "watch" if status == "ok" else status
                priority = "medium" if reorder["priority"] == "low" else reorder["priority"]
                message = (
                    f"📅 FESTIVAL ANNOUNCEMENT: '{scheduled_event['name']}' scheduled for {scheduled_event['start_date']}. "
                    f"Demand multiplier is {fest_mult:.1f}x. "
                    f"Order {fest_order_qty:,} units ahead of time so shipment arrives before the festival."
                )
                qty = fest_order_qty
            else:
                alert_type = "warning"
                alert_status = status
                priority = reorder["priority"]
                message = (
                    f"⚡ LOW INVENTORY: {ing['name']} cover is down to {cover_str} "
                    f"(approaching supplier lead time of {lt_str}). Order {qty:,} units now."
                )

            alerts.append({
                "ingredient_id": ing["id"],
                "name": ing["name"],
                "status": alert_status,
                "priority": priority,
                "days_of_cover": cover,
                "lead_time_days": lt,
                "order_qty": qty,
                "alert_type": alert_type,
                "message": message,
            })

    # Sort alerts by urgency (critical first, lowest days of cover)
    alerts.sort(key=lambda a: (priority_weight.get(a["status"], 3), a["days_of_cover"]))
    return alerts


@app.get("/api/simulate/{ingredient_id}")
def simulate_ingredient_stock(ingredient_id: int):
    """
    Task B5c: Runs a 14-day forward day-by-day inventory simulation across 3 distinct scenarios:
    1. 'do_nothing': No replenishment order placed; stock depletes until 0.
    2. 'order_now': Order placed today; arrives on day lead_time.
       If cover is less than lead time, reveals the temporary stockout gap before delivery arrives.
    3. 'ordered_ahead': Order placed proactively 7 days ahead of an announced festival,
       arriving on day 1 and completely eliminating the stockout gap.

    Evaluation sequence for each day:
        1. Morning Stock
        2. Daily Demand Subtracted (demand first!)
        3. Delivery Received (delivery added to stock!)
        4. Evening Stock (shortage recorded if morning stock was insufficient for demand)
    """
    ingredients = get_ingredients()
    target_ing = next((i for i in ingredients if i["id"] == ingredient_id), None)
    if not target_ing:
        raise HTTPException(status_code=404, detail=f"Ingredient with ID {ingredient_id} not found")

    active_events = get_active_events()
    state = compute_ingredient_state(target_ing, active_events, log_audit=False)

    stock_initial = target_ing["current_stock"]
    lead_time = target_ing["lead_time_days"]
    cover_days = target_ing["cover_days"]
    order_qty = state["reorder_res"]["order_qty"]
    forecast_14 = state["forecast_14"]

    # Helper simulating a single trajectory
    def run_trajectory(
        delivery_day: Optional[int], delivery_amount: int, auto_reorder: bool = False
    ) -> Dict[str, Any]:
        current_level = stock_initial
        timeline = []
        stockout_day = None
        total_shortage = 0
        deliveries = {delivery_day: delivery_amount} if delivery_day is not None else {}

        for day_num, (date_str, demand) in enumerate(forecast_14, start=1):
            morning_stock = current_level
            delivery = deliveries.get(day_num, 0)

            # 1. Demand occurs first
            stock_after_demand = morning_stock - demand

            if stock_after_demand < 0:
                day_shortage = abs(stock_after_demand)
                total_shortage += day_shortage
                if stockout_day is None:
                    stockout_day = day_num
                available_to_sell = max(0.0, morning_stock)
                unfilled = day_shortage
                evening_stock = delivery
            else:
                available_to_sell = demand
                unfilled = 0
                evening_stock = stock_after_demand + delivery

            current_level = evening_stock

            # If auto_reorder enabled, schedule routine replenishment when stock approaches lead time threshold
            if auto_reorder:
                has_pending = any(d_day > day_num for d_day in deliveries)
                reorder_threshold = demand * (lead_time + 1)
                baseline_rate = (
                    state["spike_info"]["baseline_avg"]
                    if state["spike_info"]["baseline_avg"] > 0
                    else state["daily_forecast"]
                )
                if evening_stock <= reorder_threshold and not has_pending and day_num + lead_time <= 14:
                    routine_qty = int(round(baseline_rate * (lead_time + cover_days)))
                    deliveries[day_num + max(1, lead_time)] = routine_qty

            timeline.append({
                "day": day_num,
                "date": date_str,
                "morning_stock": round(morning_stock, 1),
                "demand": round(demand, 1),
                "delivery": delivery,
                "evening_stock": round(evening_stock, 1),
                "stockout": stock_after_demand < 0,
                "unfilled_demand": round(unfilled, 1),
            })

        return {
            "order_qty": sum(deliveries.values()),
            "arrival_day": delivery_day,
            "stockout_day": stockout_day,
            "units_short": int(round(total_shortage)),
            "timeline": timeline,
        }

    # 1. Scenario: Do nothing (uncontrolled stockout)
    scenario_do_nothing = run_trajectory(delivery_day=None, delivery_amount=0, auto_reorder=False)
    scenario_do_nothing["label"] = "Do Nothing (Stockout)"

    # 2. Scenario: Order now (arrives on day lead_time)
    arrival_day_now = max(1, lead_time)
    scenario_order_now = run_trajectory(
        delivery_day=arrival_day_now, delivery_amount=order_qty, auto_reorder=True
    )
    scenario_order_now["label"] = "Order Today (Reactive)"

    # 3. Scenario: Proactive order (arrives on day 1)
    # For a surprise spike, this represents the counterfactual "If We Had Known".
    # For an announced festival, this represents the planned proactive pre-order.
    total_14d_demand = sum(demand for _, demand in forecast_14)
    std_dev = state["spike_info"]["baseline_std"] if state["spike_info"]["baseline_std"] > 0 else 10.0
    ahead_order_qty = max(
        order_qty,
        int(math.ceil(total_14d_demand - stock_initial + (1.65 * std_dev * math.sqrt(lead_time)))),
    )
    scenario_proactive = run_trajectory(delivery_day=1, delivery_amount=ahead_order_qty, auto_reorder=True)
    is_counterfactual = bool(state["spike_info"]["is_spike"])
    scenario_proactive["label"] = (
        "If We Had Known (Counterfactual)" if is_counterfactual else "Proactively Ordered Ahead"
    )
    scenario_proactive["is_counterfactual"] = is_counterfactual

    # Build plain-English summary with exact numbers and plural fix
    lt_str = "1 day" if lead_time == 1 else f"{lead_time} days"
    if scenario_do_nothing["stockout_day"] is not None:
        so_day = scenario_do_nothing["stockout_day"]
        if scenario_order_now["stockout_day"] is not None:
            now_so_day = scenario_order_now["stockout_day"]
            now_units_short = scenario_order_now["units_short"]
            if is_counterfactual:
                summary = (
                    f"Without reordering, {target_ing['name']} runs out on day {so_day} "
                    f"({scenario_do_nothing['units_short']:,} units lost). "
                    f"Ordering reactively today still leaves a brief stockout gap on day {now_so_day} "
                    f"({now_units_short:,} units short) because supplier delivery takes {lt_str}. "
                    f"If we had known about the surge in advance, proactive ordering would have completely eliminated the stockout."
                )
            else:
                summary = (
                    f"Without reordering, {target_ing['name']} runs out on day {so_day} "
                    f"({scenario_do_nothing['units_short']:,} units lost). "
                    f"Ordering today leaves a gap before shipment arrives on day {arrival_day_now}. "
                    f"Proactively ordering ahead delivers replenishment before festival demand begins, ensuring zero stockouts."
                )
        else:
            summary = (
                f"Without reordering, {target_ing['name']} runs out on day {so_day}. "
                f"With our replenishment order of {order_qty:,} units, inventory stays safely above zero."
            )
    else:
        summary = f"{target_ing['name']} current stock is sufficient for the next 14 days without reordering."

    return {
        "ingredient_id": target_ing["id"],
        "name": target_ing["name"],
        "current_stock": stock_initial,
        "lead_time_days": lead_time,
        "daily_evaluation_order": "1. Morning Stock -> 2. Daily Demand Subtracted -> 3. Delivery Received -> 4. Evening Stock",
        "scenarios": {
            "do_nothing": scenario_do_nothing,
            "order_now": scenario_order_now,
            "if_we_had_known": scenario_proactive,
            "ordered_ahead": scenario_proactive,  # Alias for backward contract compatibility
        },
        "summary": summary,
    }


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
