"""
Tests for ML Forecasting Engine (tests/test_ml_forecast.py)
"""

import pytest
from backend.ml_forecast import ml_forecast, train_ml_model


def test_ml_forecast_fallback_when_no_model():
    """If no model file exists for ingredient_id=999, it cleanly falls back to 7-day MA."""
    history = [100, 100, 100, 100, 100, 100, 100]
    res = ml_forecast(history, days_ahead=3, event_multiplier=1.0, ingredient_id=999)
    assert len(res) == 3
    assert res == [100.0, 100.0, 100.0]


def test_ml_forecast_event_multiplier():
    """Event multiplier should scale predictions linearly."""
    history = [100, 110, 120, 130, 140, 150, 160] * 3
    base_res = ml_forecast(history, days_ahead=3, event_multiplier=1.0, ingredient_id=1)
    spiked_res = ml_forecast(history, days_ahead=3, event_multiplier=2.0, ingredient_id=1)

    assert len(base_res) == 3
    assert len(spiked_res) == 3
    for b, s in zip(base_res, spiked_res):
        assert abs(s - (b * 2.0)) < 0.05


def test_ml_forecast_validation_errors():
    """Validates parameter ranges."""
    with pytest.raises(ValueError):
        ml_forecast([10, 20], days_ahead=3)  # too short (<7)

    with pytest.raises(ValueError):
        ml_forecast([10] * 10, days_ahead=0)  # days_ahead < 1
