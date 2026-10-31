"""
Edge case and Phase 3 feature verification tests (backend/test_edge_cases.py).
Tests date-bounded festivals, alerts, 14-day stock simulation, and edge case resilience.
"""

import math
from datetime import datetime, timedelta
import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.db import init_db, get_connection, get_reorders, reset_state
from backend.reorder import calculate_reorder

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_baseline():
    """Ensures database is initialized and clean before and after each test."""
    init_db()
    client.post("/api/reset")
    yield
    client.post("/api/reset")


def test_b5a_festival_by_dates_announcement_path():
    """
    Test B5a: Festival multiplier applies only on festival dates [start_date, end_date].
    An event scheduled for next week raises forecast on those dates only,
    while today's immediate demand and status remain 'ok' (green).
    """
    # 1. Check baseline forecast
    base_fc = client.get("/api/forecast/1").json()
    first_day_units = base_fc["forecast"][0]["units"]
    seventh_day_date = base_fc["forecast"][6]["date"]

    # 2. Schedule festival starting on the 7th day
    event_payload = {
        "name": "Midwinter Solstice",
        "ingredient_ids": [1],
        "multiplier": 3.0,
        "start_date": seventh_day_date,
        "end_date": "2024-01-20",
    }
    event_resp = client.post("/api/event", json=event_payload)
    assert event_resp.status_code == 200

    # 3. Check /api/forecast/1: Day 1 should be normal, Day 7 should be tripled!
    updated_fc = client.get("/api/forecast/1").json()
    day1_units = updated_fc["forecast"][0]["units"]
    day7_units = updated_fc["forecast"][6]["units"]
    seventh_day_baseline = base_fc["forecast"][6]["units"]

    assert abs(day1_units - first_day_units) < 1.0, "Day 1 should not be tripled before festival starts!"
    assert day7_units > seventh_day_baseline * 2.5, "Day 7 should be multiplied by 3x on festival start date!"

    # 4. Check /api/ingredients: Today's status remains 'ok' (green) because current stock is safe today
    ings = client.get("/api/ingredients").json()
    moonflower = next(i for i in ings if i["id"] == 1)
    assert moonflower["status"] == "ok"


def test_b5b_alerts_endpoint():
    """
    Test B5b: GET /api/alerts returns plain-English messages for critical and watch items,
    ranked by urgency. Returns empty list [] when all items are healthy.
    Distinguishes unannounced spike from scheduled festival alerts.
    """
    # 1. When all ingredients are green, alerts list must be empty
    alerts_clean = client.get("/api/alerts").json()
    assert alerts_clean == []

    # 2. Trigger surprise spike
    client.post("/api/simulate-spike")
    alerts_spiked = client.get("/api/alerts").json()
    assert len(alerts_spiked) >= 2

    # Most urgent must be critical with spike wording
    first_alert = alerts_spiked[0]
    assert first_alert["status"] == "critical"
    assert first_alert["alert_type"] == "spike"
    assert "SPIKE DETECTED" in first_alert["message"]
    assert "runs out in" in first_alert["message"]

    # 3. Reset clears alerts back to empty
    client.post("/api/reset")
    alerts_after_reset = client.get("/api/alerts").json()
    assert alerts_after_reset == []


def test_b5c_simulation_endpoint():
    """
    Test B5c: GET /api/simulate/{id} returns 14-day simulation for:
    - do_nothing (hits 0)
    - order_now (arrives on day lead_time)
    - ordered_ahead (avoids stockout)
    Validates daily evaluation order: demand subtracted first, delivery added second.
    """
    # Trigger spike so Moonflower runs out
    client.post("/api/simulate-spike")

    sim_resp = client.get("/api/simulate/1")
    assert sim_resp.status_code == 200
    data = sim_resp.json()

    assert data["ingredient_id"] == 1
    assert "Morning Stock -> 2. Daily Demand" in data["daily_evaluation_order"]
    scenarios = data["scenarios"]

    # Do nothing hits stockout
    do_nothing = scenarios["do_nothing"]
    assert do_nothing["stockout_day"] is not None
    assert do_nothing["units_short"] > 0
    assert len(do_nothing["timeline"]) == 14

    # Order now arrives on day lead_time
    order_now = scenarios["order_now"]
    assert order_now["arrival_day"] == 2
    assert order_now["order_qty"] > 0

    # Ordered ahead arrives on day 1 with 0 stockout
    ordered_ahead = scenarios["ordered_ahead"]
    assert ordered_ahead["arrival_day"] == 1
    assert ordered_ahead["stockout_day"] is None
    assert ordered_ahead["units_short"] == 0


def test_b6_no_duplicate_reorders_on_repeated_gets():
    """
    Test B6: Reorder audit logging does not write duplicate rows on repeated GET requests.
    """
    # Trigger spike to create reorder need
    client.post("/api/simulate-spike")

    # Initial count of reorder records
    initial_reorders = get_reorders()
    initial_count = len(initial_reorders)

    # Call GET /api/ingredients 10 times in a row
    for _ in range(10):
        client.get("/api/ingredients")
        client.get("/api/reorders")

    # Count must remain unchanged
    final_reorders = get_reorders()
    assert len(final_reorders) == initial_count


def test_edge_cases_pure_reorder_math():
    """
    Test edge cases in calculate_reorder:
    1. Zero stock
    2. Zero forecast / demand
    3. Lead time 0
    4. Extreme lead time (30 days)
    """
    # 1. Zero stock with positive forecast gives critical
    res_zero_stock = calculate_reorder(100, 10, 2, 3, 0)
    assert res_zero_stock["days_of_cover"] == 0.0
    assert res_zero_stock["status"] == "critical"
    assert res_zero_stock["order_qty"] > 0

    # 2. Zero forecast returns 999 days of cover, status ok, no crash
    res_zero_fc = calculate_reorder(0, 0, 2, 3, 500)
    assert res_zero_fc["days_of_cover"] == 999.0
    assert res_zero_fc["status"] == "ok"
    assert res_zero_fc["order_qty"] == 0

    # 3. Lead time 0 gives safety stock 0 and does not crash
    res_zero_lead = calculate_reorder(100, 10, 0, 3, 400)
    assert res_zero_lead["safety_stock"] == 0
    assert res_zero_lead["status"] == "ok"

    # 4. Extreme lead time (30 days) calculates large target stock
    res_extreme_lead = calculate_reorder(100, 10, 30, 3, 400)
    assert res_extreme_lead["safety_stock"] > 0
    assert res_extreme_lead["target_stock"] > 3000
    assert res_extreme_lead["status"] == "critical"  # Cover (4d) < Lead time (30d)


def test_edge_case_all_six_ingredients_spiking_simultaneously():
    """
    Test extreme scenario: append 3x sales for ALL 6 ingredients.
    Verifies that system flags all 6 as spikes without crashing.
    """
    conn = get_connection()
    with conn:
        cursor = conn.cursor()
        for ing_id in range(1, 7):
            cursor.execute(
                "INSERT OR REPLACE INTO sales (date, ingredient_id, units) VALUES ('2024-01-02', ?, 3000);",
                (ing_id,),
            )
            cursor.execute(
                "INSERT OR REPLACE INTO sales (date, ingredient_id, units) VALUES ('2024-01-03', ?, 3000);",
                (ing_id,),
            )
    conn.close()

    ings = client.get("/api/ingredients").json()
    assert len(ings) == 6
    for ing in ings:
        assert ing["status"] in ["critical", "watch"]
        assert ing["order_qty"] > 0

    # Clean up and reset
    reset_resp = client.post("/api/reset")
    assert reset_resp.status_code == 200

    ings_reset = client.get("/api/ingredients").json()
    for ing in ings_reset:
        assert ing["status"] == "ok"
        assert ing["order_qty"] == 0
