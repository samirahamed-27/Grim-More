"""
Unit tests for Potion Pantry Inventory Reorder Calculator (backend/test_reorder.py).
Validates mathematical accuracy against worked examples, edge cases, and boundary rules.
"""

import pytest
from backend.reorder import calculate_reorder


def test_normal_week_worked_example():
    """
    Test 1: Normal week Moonflower example from Page 4.
    Forecast: 100/day, std: 10, lead time: 2 days, cover days: 3, stock: 400.
    Expected: safety_stock 23, target_stock 523, order_qty 123, days_of_cover 4.0, status 'ok', priority 'low'.
    """
    result = calculate_reorder(
        daily_forecast=100,
        std=10,
        lead_time_days=2,
        cover_days=3,
        current_stock=400,
    )
    assert result["safety_stock"] == 23
    assert result["target_stock"] == 523
    assert result["order_qty"] == 123
    assert result["days_of_cover"] == 4.0
    assert result["status"] == "ok"
    assert result["priority"] == "low"


def test_festival_week_worked_example():
    """
    Test 2: Festival week Moonflower example from Page 4.
    Forecast: 300/day, std: 30, lead time: 2 days, cover days: 3, stock: 400.
    Expected: safety_stock 70, target_stock 1570, order_qty 1170, days_of_cover 1.3, status 'critical', priority 'high'.
    """
    result = calculate_reorder(
        daily_forecast=300,
        std=30,
        lead_time_days=2,
        cover_days=3,
        current_stock=400,
    )
    assert result["safety_stock"] == 70
    assert result["target_stock"] == 1570
    assert result["order_qty"] == 1170
    assert result["days_of_cover"] == 1.3
    assert result["status"] == "critical"
    assert result["priority"] == "high"


def test_stock_above_target_gives_zero_order_qty():
    """
    Test 3: Stock above target must return order_qty 0 (never negative).
    """
    result = calculate_reorder(
        daily_forecast=50,
        std=5,
        lead_time_days=2,
        cover_days=2,
        current_stock=1000,  # Well above target stock (~211)
    )
    assert result["order_qty"] == 0
    assert result["status"] == "ok"


def test_zero_stock_with_positive_forecast():
    """
    Test 4: Zero stock with positive forecast gives critical status.
    """
    result = calculate_reorder(
        daily_forecast=100,
        std=10,
        lead_time_days=2,
        cover_days=3,
        current_stock=0,
    )
    assert result["days_of_cover"] == 0.0
    assert result["status"] == "critical"
    assert result["priority"] == "high"
    assert result["order_qty"] > 0


def test_zero_forecast_safe_handling():
    """
    Test 5: Zero forecast must not crash; returns days_of_cover 999 and status 'ok'.
    """
    result = calculate_reorder(
        daily_forecast=0,
        std=0,
        lead_time_days=2,
        cover_days=3,
        current_stock=100,
    )
    assert result["days_of_cover"] == 999.0
    assert result["status"] == "ok"
    assert result["priority"] == "low"
    assert result["order_qty"] == 0


def test_negative_stock_treated_as_zero():
    """
    Test 6: Negative stock is sanitized to 0.
    """
    result_negative = calculate_reorder(
        daily_forecast=100,
        std=10,
        lead_time_days=2,
        cover_days=3,
        current_stock=-50,
    )
    result_zero = calculate_reorder(
        daily_forecast=100,
        std=10,
        lead_time_days=2,
        cover_days=3,
        current_stock=0,
    )
    assert result_negative == result_zero
    assert result_negative["status"] == "critical"


def test_boundary_conditions():
    """
    Test 7: Boundary conditions:
    - days_of_cover exactly equal to lead_time_days -> 'watch' (not 'critical').
    - days_of_cover exactly equal to lead_time_days + 2 -> 'ok'.
    """
    # 1. days_of_cover == lead_time_days (200 / 100 = 2.0 days cover, lead time = 2)
    boundary_watch = calculate_reorder(
        daily_forecast=100,
        std=10,
        lead_time_days=2,
        cover_days=3,
        current_stock=200,
    )
    assert boundary_watch["days_of_cover"] == 2.0
    assert boundary_watch["status"] == "watch"
    assert boundary_watch["priority"] == "medium"

    # 2. days_of_cover == lead_time_days + 2 (400 / 100 = 4.0 days cover, lead time = 2)
    boundary_ok = calculate_reorder(
        daily_forecast=100,
        std=10,
        lead_time_days=2,
        cover_days=3,
        current_stock=400,
    )
    assert boundary_ok["days_of_cover"] == 4.0
    assert boundary_ok["status"] == "ok"
    assert boundary_ok["priority"] == "low"


def test_contract_keys():
    """
    Test 8: The returned dictionary must contain exactly the 6 contract keys.
    """
    result = calculate_reorder(
        daily_forecast=100,
        std=10,
        lead_time_days=2,
        cover_days=3,
        current_stock=400,
    )
    expected_keys = {
        "safety_stock",
        "target_stock",
        "order_qty",
        "days_of_cover",
        "status",
        "priority",
    }
    assert set(result.keys()) == expected_keys
