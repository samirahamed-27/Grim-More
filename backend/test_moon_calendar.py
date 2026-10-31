"""
Tests for B8: Real Full-Moon Calendar (GET /api/calendar/upcoming)
Verifies:
1. Known late-January 2024 full moon appears with correct days_until (23 days from 2024-01-02).
2. ?today override works, including returning empty list when no full moon is in window.
3. Suggested event payload is accepted by POST /api/event and applies date-bounded forecast.
4. Calendar endpoint never writes to or alters database state.
5. Order-by dates strictly match each ingredient's individual lead time.
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.db import get_connection, get_active_events


@pytest.fixture(autouse=True)
def clean_db():
    client = TestClient(app)
    client.post("/api/reset")
    yield
    client.post("/api/reset")


def test_known_late_january_2024_full_moon():
    client = TestClient(app)
    res = client.get("/api/calendar/upcoming?days=30")
    assert res.status_code == 200, res.text
    upcoming = res.json()

    assert len(upcoming) >= 1
    wolf_moon = next(m for m in upcoming if m["date"] == "2024-01-25")
    # Baseline demo_today is 2024-01-02 -> days_until 2024-01-25 is exactly 23 days
    assert wolf_moon["days_until"] == 23

    # Check suggested_event prefilled format
    ev = wolf_moon["suggested_event"]
    assert ev["name"] == "Full Moon Festival"
    assert ev["ingredient_ids"] == [1, 2, 3]
    assert ev["multiplier"] == 3.0
    assert ev["start_date"] == "2024-01-25"
    assert ev["end_date"] == "2024-01-27"


def test_today_override_and_empty_window():
    client = TestClient(app)

    # Override today to 2024-01-20 -> days_until 2024-01-25 should be 5
    r1 = client.get("/api/calendar/upcoming?today=2024-01-20&days=10")
    assert r1.status_code == 200
    u1 = r1.json()
    assert len(u1) == 1
    assert u1[0]["date"] == "2024-01-25"
    assert u1[0]["days_until"] == 5

    # Window that contains no full moon (e.g. 2024-01-05 with 10 days window ends 2024-01-15)
    r2 = client.get("/api/calendar/upcoming?today=2024-01-05&days=10")
    assert r2.status_code == 200
    assert r2.json() == []


def test_order_by_date_uses_individual_lead_times():
    client = TestClient(app)
    res = client.get("/api/calendar/upcoming?days=30")
    assert res.status_code == 200
    wolf_moon = next(m for m in res.json() if m["date"] == "2024-01-25")

    # Moonflower lead time 2 -> order by 2024-01-23
    mf = next(i for i in wolf_moon["ingredients"] if i["ingredient_id"] == 1)
    assert mf["lead_time_days"] == 2
    assert mf["order_by_date"] == "2024-01-23"

    # Silver Dew lead time 1 -> order by 2024-01-24
    sd = next(i for i in wolf_moon["ingredients"] if i["ingredient_id"] == 2)
    assert sd["lead_time_days"] == 1
    assert sd["order_by_date"] == "2024-01-24"

    # Wolfsbane lead time 3 -> order by 2024-01-22
    wb = next(i for i in wolf_moon["ingredients"] if i["ingredient_id"] == 3)
    assert wb["lead_time_days"] == 3
    assert wb["order_by_date"] == "2024-01-22"


def test_suggested_event_accepted_by_post_event_and_dates_bounded():
    client = TestClient(app)
    r_cal = client.get("/api/calendar/upcoming?days=30")
    assert r_cal.status_code == 200
    suggested = r_cal.json()[0]["suggested_event"]

    # Post suggested_event directly to /api/event
    r_post = client.post("/api/event", json=suggested)
    assert r_post.status_code == 200

    # Verify today's status stays green because event is in the future
    r_ings = client.get("/api/ingredients")
    assert r_ings.status_code == 200
    for ing in r_ings.json():
        assert ing["status"] == "ok"

    # Verify date-bounded forecast on Moonflower: 2024-01-25 is beyond 14d horizon from Jan 2,
    # so test with today closer to the event (e.g. override event to 2024-01-08)
    event_payload = {
        "name": "Full Moon Festival",
        "ingredient_ids": [1, 2, 3],
        "multiplier": 3.0,
        "start_date": "2024-01-08",
        "end_date": "2024-01-10",
    }
    client.post("/api/event", json=event_payload)
    r_fc = client.get("/api/forecast/1")
    assert r_fc.status_code == 200
    fc = r_fc.json()["forecast"]
    for day in fc:
        if day["date"] in ["2024-01-08", "2024-01-09", "2024-01-10"]:
            assert day["in_event_window"] is True
            assert day["units"] > 1400
        else:
            assert day["in_event_window"] is False


def test_calendar_never_writes_to_database():
    client = TestClient(app)
    conn = get_connection()
    c1 = conn.cursor()
    c1.execute("SELECT COUNT(*) AS cnt FROM events;")
    events_before = c1.fetchone()["cnt"]
    c1.execute("SELECT COUNT(*) AS cnt FROM sales;")
    sales_before = c1.fetchone()["cnt"]
    conn.close()

    # Call calendar 10 times with different parameters
    for d in [10, 30, 60, 90]:
        client.get(f"/api/calendar/upcoming?days={d}")
    client.get("/api/calendar/upcoming?today=2024-01-15&days=30")

    conn = get_connection()
    c2 = conn.cursor()
    c2.execute("SELECT COUNT(*) AS cnt FROM events;")
    events_after = c2.fetchone()["cnt"]
    c2.execute("SELECT COUNT(*) AS cnt FROM sales;")
    sales_after = c2.fetchone()["cnt"]
    conn.close()

    assert events_before == events_after
    assert sales_before == sales_after

