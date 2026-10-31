"""
Unit tests for Potion Pantry SQLite Database Engine (backend/test_db.py).
Tests table creation, idempotent seeding, green stock calculation, and CRUD operations.
"""

import os
import sqlite3
import tempfile
from pathlib import Path
import pytest

from backend.db import (
    init_db,
    get_connection,
    get_ingredients,
    get_recent_sales,
    insert_event,
    get_active_events,
    record_reorder,
    get_reorders,
    reset_state,
)


@pytest.fixture
def temp_db():
    """Provides a fresh temporary SQLite database path for isolated testing."""
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    yield Path(path)
    if os.path.exists(path):
        os.remove(path)


def test_db_tables_and_seeding(temp_db):
    """
    Verifies that init_db creates all 4 tables, populates 6 ingredients,
    loads 4,386 sales rows (6 x 731 days), and is safe to run repeatedly.
    """
    # 1. First run creates tables and seeds data
    init_db(temp_db)

    conn = get_connection(temp_db)
    cursor = conn.cursor()

    # Check 4 tables exist
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
    tables = {row["name"] for row in cursor.fetchall()}
    expected_tables = {"ingredients", "sales", "events", "reorders"}
    assert expected_tables.issubset(tables), f"Missing tables. Found: {tables}"

    # Check 6 ingredients
    cursor.execute("SELECT COUNT(*) AS cnt FROM ingredients;")
    assert cursor.fetchone()["cnt"] == 6

    # Check 4386 sales records
    cursor.execute("SELECT COUNT(*) AS cnt FROM sales;")
    assert cursor.fetchone()["cnt"] == 4386

    # 2. Re-running init_db must be idempotent (no duplicate rows or primary key errors)
    init_db(temp_db)
    cursor.execute("SELECT COUNT(*) AS cnt FROM ingredients;")
    assert cursor.fetchone()["cnt"] == 6
    cursor.execute("SELECT COUNT(*) AS cnt FROM sales;")
    assert cursor.fetchone()["cnt"] == 4386
    conn.close()


def test_green_initial_stock(temp_db):
    """
    Verifies Known Issue 1 Fix:
    Every ingredient must start with days_of_cover >= lead_time_days + 2,
    guaranteeing that its starting inventory status is 'ok' (green).
    """
    init_db(temp_db)
    ingredients = get_ingredients(temp_db)

    assert len(ingredients) == 6

    for ing in ingredients:
        ing_id = ing["id"]
        stock = ing["current_stock"]
        lead_time = ing["lead_time_days"]

        # Calculate 14-day daily average sales
        recent_sales = get_recent_sales(ing_id, days=14, db_path=temp_db)
        assert len(recent_sales) == 14
        mean_sales = sum(r["units"] for r in recent_sales) / 14.0

        # Days of cover calculation
        days_of_cover = stock / mean_sales
        required_buffer = lead_time + 2.0

        assert days_of_cover >= required_buffer, (
            f"Ingredient {ing['name']} (ID {ing_id}) has days_of_cover {days_of_cover:.2f}, "
            f"which is less than lead_time + 2 ({required_buffer:.2f}). Starting status would not be 'ok'!"
        )


def test_events_and_reorders_roundtrip(temp_db):
    """
    Verifies insert_event, get_active_events, record_reorder, get_reorders,
    and reset_state operations.
    """
    init_db(temp_db)

    # 1. Insert and retrieve festival event
    event_id = insert_event(
        name="Full Moon Festival",
        ingredient_ids=[1, 2, 3],
        multiplier=3.0,
        start_date="2026-11-08",
        end_date="2026-11-14",
        db_path=temp_db,
    )
    assert event_id > 0

    events = get_active_events(temp_db)
    assert len(events) == 1
    assert events[0]["name"] == "Full Moon Festival"
    assert events[0]["ingredient_ids"] == [1, 2, 3]
    assert events[0]["multiplier"] == 3.0

    # 2. Record and retrieve reorder recommendations
    reorder_id_1 = record_reorder(ingredient_id=1, order_qty=1170, priority="high", db_path=temp_db)
    reorder_id_2 = record_reorder(ingredient_id=4, order_qty=200, priority="low", db_path=temp_db)
    assert reorder_id_1 > 0
    assert reorder_id_2 > 0

    reorders = get_reorders(temp_db)
    assert len(reorders) == 2
    # Urgent high priority must appear first
    assert reorders[0]["ingredient_id"] == 1
    assert reorders[0]["priority"] == "high"
    assert reorders[0]["order_qty"] == 1170

    # 3. Test reset_state
    reset_state(temp_db)
    assert len(get_active_events(temp_db)) == 0
    assert len(get_reorders(temp_db)) == 0

    # Ingredients must still be intact and green
    ingredients = get_ingredients(temp_db)
    assert len(ingredients) == 6


if __name__ == "__main__":
    pytest.main(["-v", str(Path(__file__))])

