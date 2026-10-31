"""
Tests for B7: Sales Input Door (POST /api/sales and POST /api/sales/batch)
Verifies:
1. Valid sale is saved and updates ingredient state and forecast history.
2. Multiple sales for the same day add to the total with no duplicate rows.
3. Strict validation: unknown ingredient, negative units, bad date, read-only history, and date gaps.
4. Consecutive 3x sales trigger the 2-day spike detector into critical/watch status.
5. POST /api/reset removes all added rows and restores all ingredients to green.
6. Batch sales ingestion is strictly all-or-nothing (atomic).
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.db import get_connection, reset_state


@pytest.fixture(autouse=True)
def clean_db():
    """Ensure each test runs from a pristine baseline state."""
    client = TestClient(app)
    client.post("/api/reset")
    yield
    client.post("/api/reset")


def test_valid_sale_is_saved_and_updates_forecast():
    client = TestClient(app)
    payload = {"ingredient_id": 1, "date": "2024-01-02", "units": 500}
    res = client.post("/api/sales", json=payload)
    assert res.status_code == 200, res.text
    data = res.json()

    assert data["action"] == "created"
    assert data["ingredient_id"] == 1
    assert data["name"] == "Moonflower"
    assert data["date"] == "2024-01-02"
    assert data["units"] == 500
    assert data["added_units"] == 500
    assert "daily_forecast" in data
    assert "spike_info" in data
    assert "status" in data
    assert "order_qty" in data

    # Verify history in forecast endpoint reflects the new sale
    f_res = client.get("/api/forecast/1")
    assert f_res.status_code == 200
    f_data = f_res.json()
    dates = [h["date"] for h in f_data["history"]]
    assert "2024-01-02" in dates
    latest_entry = next(h for h in f_data["history"] if h["date"] == "2024-01-02")
    assert latest_entry["units"] == 500


def test_duplicate_date_adds_to_total_no_duplicate_row():
    client = TestClient(app)
    # First sale on 2024-01-02
    r1 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-02", "units": 400})
    assert r1.status_code == 200
    assert r1.json()["action"] == "created"
    assert r1.json()["units"] == 400

    # Second sale on same date should increment existing total
    r2 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-02", "units": 250})
    assert r2.status_code == 200
    assert r2.json()["action"] == "updated"
    assert r2.json()["units"] == 650
    assert r2.json()["added_units"] == 250

    # Verify directly in SQLite that exactly one row exists
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT units FROM sales WHERE date = '2024-01-02' AND ingredient_id = 1;")
    rows = cursor.fetchall()
    conn.close()
    assert len(rows) == 1
    assert rows[0]["units"] == 650


def test_validation_rejections():
    client = TestClient(app)

    # 1. Unknown ingredient ID
    r_bad_id = client.post("/api/sales", json={"ingredient_id": 99, "date": "2024-01-02", "units": 100})
    assert r_bad_id.status_code == 422
    assert "Unknown ingredient_id 99" in r_bad_id.text

    # 2. Negative units
    r_neg_units = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-02", "units": -20})
    assert r_neg_units.status_code == 422
    assert "non-negative" in r_neg_units.text

    # 3. Bad date format / impossible date
    r_bad_date = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-02-31", "units": 100})
    assert r_bad_date.status_code == 422
    assert "Invalid date format" in r_bad_date.text

    # 4. Read-only historical baseline protection (<= 2024-01-01)
    r_hist = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-01", "units": 100})
    assert r_hist.status_code == 422
    assert "read-only" in r_hist.text

    # 5. Gap in history (skipping 2024-01-02 when latest is 2024-01-01)
    r_gap = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-03", "units": 100})
    assert r_gap.status_code == 422
    assert "gap" in r_gap.text
    assert "Next expected date is 2024-01-02" in r_gap.text


def test_two_consecutive_days_trigger_spike_detector():
    """
    Spike detection uses the last 2 days vs the prior 14-day baseline.
    One day of 3x sales is buffered by the previous normal day and should not trigger z > 3.
    Two consecutive days of 3x sales elevates recent_avg fully and triggers a critical spike.
    """
    client = TestClient(app)

    # Day 1: high sales (2,000 units ~ 3x normal 664)
    r1 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-02", "units": 2000})
    assert r1.status_code == 200
    d1 = r1.json()
    # Day 1 recent_avg = (463 + 2000)/2 = 1231.5 -> z-score ~ 2.27 -> not yet a spike
    assert d1["spike_info"]["is_spike"] is False
    assert d1["status"] in ["ok", "watch"]

    # Day 2: second high sales day (2,000 units)
    r2 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-03", "units": 2000})
    assert r2.status_code == 200
    d2 = r2.json()
    # Day 2 recent_avg = (2000 + 2000)/2 = 2000.0 -> z-score ~ 5.3 > 3.0 -> triggers spike!
    assert d2["spike_info"]["is_spike"] is True
    assert d2["status"] == "critical"
    assert d2["priority"] == "high"
    assert d2["order_qty"] > 0


def test_reset_clears_sales_and_returns_green():
    client = TestClient(app)
    # Add sales for 2024-01-02 and 2024-01-03
    client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-02", "units": 2000})
    client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-03", "units": 2000})

    # Call reset
    r_reset = client.post("/api/reset")
    assert r_reset.status_code == 200

    # Verify no sales rows exist past 2024-01-01
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS cnt FROM sales WHERE date > '2024-01-01';")
    cnt = cursor.fetchone()["cnt"]
    conn.close()
    assert cnt == 0

    # Verify all ingredients returned to green
    r_ings = client.get("/api/ingredients")
    assert r_ings.status_code == 200
    ings = r_ings.json()
    for ing in ings:
        assert ing["status"] == "ok"
        assert ing["order_qty"] == 0
        assert ing["priority"] == "low"


def test_batch_all_or_nothing():
    client = TestClient(app)

    # Valid batch: 2 ingredients on 2024-01-02
    valid_batch = [
        {"ingredient_id": 1, "date": "2024-01-02", "units": 500},
        {"ingredient_id": 2, "date": "2024-01-02", "units": 600},
    ]
    r_valid = client.post("/api/sales/batch", json=valid_batch)
    assert r_valid.status_code == 200
    assert r_valid.json()["records_processed"] == 2

    # Invalid batch: Item 0 is valid (2024-01-03), Item 1 has negative units
    bad_batch = [
        {"ingredient_id": 1, "date": "2024-01-03", "units": 300},
        {"ingredient_id": 2, "date": "2024-01-03", "units": -50},
    ]
    r_bad = client.post("/api/sales/batch", json=bad_batch)
    assert r_bad.status_code == 422
    assert "Batch rejected" in r_bad.text
    assert "item 1" in r_bad.text

    # Verify all-or-nothing: Item 0 (2024-01-03, ing 1) was NOT inserted
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) AS cnt FROM sales WHERE date = '2024-01-03';")
    cnt = cursor.fetchone()["cnt"]
    conn.close()
    assert cnt == 0


def test_sales_reduce_stock_and_floor_at_zero():
    """
    Part 1F: Sales reduce stock; same-day add subtracts only added units;
    overselling floors at 0 with stock_floored=True; batch failure leaves stock untouched.
    """
    client = TestClient(app)

    # Moonflower initial green stock is 3,984
    r1 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-02", "units": 1000})
    assert r1.status_code == 200
    d1 = r1.json()
    assert d1["stock_after"] == 2984
    assert d1["stock_floored"] is False

    # Adding 500 units to same day subtracts only the additional 500 units
    r2 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-02", "units": 500})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["action"] == "updated"
    assert d2["units"] == 1500
    assert d2["added_units"] == 500
    assert d2["stock_after"] == 2484
    assert d2["stock_floored"] is False

    # Huge sale on next day (3,000 units > 2,484 stock): floors at 0 and sets stock_floored=True
    r3 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-03", "units": 3000})
    assert r3.status_code == 200
    d3 = r3.json()
    assert d3["stock_after"] == 0
    assert d3["stock_floored"] is True
    assert d3["status"] == "critical"

    # Restock restores inventory
    r_restock = client.post("/api/purchases", json={"ingredient_id": 1, "quantity": 1000})
    assert r_restock.status_code == 200
    assert r_restock.json()["current_stock"] == 1000

    # Reset restores exact seeded baseline stock (3,984)
    client.post("/api/reset")
    r_ings = client.get("/api/ingredients")
    mf = next(i for i in r_ings.json() if i["id"] == 1)
    assert mf["current_stock"] == 3984


def test_two_day_surge_leaves_stock_near_zero_critical():
    """
    Part 1F: The two-day Moonflower surge (2,000 units on Day 1, 2,000 units on Day 2)
    starting from 3,984 stock leaves stock floored at 0 and status critical.
    """
    client = TestClient(app)
    r1 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-02", "units": 2000})
    assert r1.status_code == 200
    assert r1.json()["stock_after"] == 1984

    r2 = client.post("/api/sales", json={"ingredient_id": 1, "date": "2024-01-03", "units": 2000})
    assert r2.status_code == 200
    d2 = r2.json()
    assert d2["stock_after"] == 0
    assert d2["stock_floored"] is True
    assert d2["status"] == "critical"
    assert d2["priority"] == "high"


