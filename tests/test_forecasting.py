import pytest
from backend.forecasting import (
    SPIKE_Z_THRESHOLD,
    START_WEEKDAY,
    backtest,
    detect_spike,
    forecast_demand,
    get_weekday_factors,
)
import backend.forecasting as fc


def test_validation():
    # History with fewer than 7 values raises ValueError
    with pytest.raises(ValueError, match="'history' must contain at least 7 values"):
        forecast_demand([10.0] * 6, days_ahead=3)

    # days_ahead < 1 raises ValueError
    with pytest.raises(ValueError, match="'days_ahead' must be at least 1"):
        forecast_demand([10.0] * 7, days_ahead=0)

    # negative event_multiplier raises ValueError
    with pytest.raises(ValueError, match="'event_multiplier' must be non-negative"):
        forecast_demand([10.0] * 7, days_ahead=3, event_multiplier=-0.1)


def test_flat_history():
    flat = [5.0] * 7
    result = forecast_demand(flat, days_ahead=3)
    assert result == [5.0, 5.0, 5.0]


def test_get_weekday_factors():
    # Test flat data produces all 1.0 factors
    flat = [5.0] * 7
    factors = get_weekday_factors(flat)
    assert factors == [1.0] * 7

    # Test missing weekday data produces 1.0 for unobserved weekdays
    partial = [10.0, 20.0, 30.0]
    partial_factors = get_weekday_factors(partial)
    assert len(partial_factors) == 7
    for w in range(3, 7):
        assert partial_factors[w] == 1.0


def test_only_last_7_used_when_history_longer():
    # History with 14 elements: first 7 are huge, last 7 are flat
    long_history = [1000.0] * 7 + [10.0] * 7
    factors = get_weekday_factors(long_history)
    result = forecast_demand(long_history, days_ahead=7)
    # Moving average should strictly be 10.0, scaled by factors
    for w in range(7):
        assert abs(result[w] - (10.0 * factors[w])) < 1e-9


def test_event_multiplier():
    history = [10.0, 12.0, 15.0, 14.0, 20.0, 25.0, 18.0]
    base = forecast_demand(history, days_ahead=4)
    mult_1 = forecast_demand(history, days_ahead=4, event_multiplier=1.0)
    assert mult_1 == base

    mult_2 = forecast_demand(history, days_ahead=4, event_multiplier=2.0)
    for b_val, m_val in zip(base, mult_2):
        assert abs(m_val - 2.0 * b_val) < 1e-9

    mult_half = forecast_demand(history, days_ahead=4, event_multiplier=0.5)
    for b_val, m_val in zip(base, mult_half):
        assert abs(m_val - 0.5 * b_val) < 1e-9


def test_backtest():
    # Flat history produces 0 error for both model and baseline
    flat = [10.0] * 21
    metrics = backtest(flat, holdout_days=14)
    assert abs(metrics["model"]["mae"]) < 1e-9
    assert abs(metrics["baseline"]["mae"]) < 1e-9

    # Seasonal history shows model error <= baseline error
    seasonal = [
        100.0, 100.0, 100.0, 100.0, 100.0, 200.0, 200.0,
        100.0, 100.0, 100.0, 100.0, 100.0, 200.0, 200.0,
        100.0, 100.0, 100.0, 100.0, 100.0, 200.0, 200.0,
        100.0, 100.0, 100.0, 100.0, 100.0, 200.0, 200.0,
    ]
    seasonal_metrics = backtest(seasonal, holdout_days=14)
    assert seasonal_metrics["model"]["mae"] < seasonal_metrics["baseline"]["mae"]
    assert seasonal_metrics["model"]["mape"] < seasonal_metrics["baseline"]["mape"]

    # History too short raises ValueError
    with pytest.raises(ValueError, match="must contain at least 21 values"):
        backtest([10.0] * 20, holdout_days=14)

    # holdout_days < 1 raises ValueError
    with pytest.raises(ValueError, match="'holdout_days' must be at least 1"):
        backtest([10.0] * 21, holdout_days=0)


def test_detect_spike_and_validation():
    # History with fewer than 16 values raises ValueError
    with pytest.raises(ValueError, match="'history' must contain at least 16 values"):
        detect_spike([10.0] * 15)

    # Valid flat history
    result = detect_spike([10.0] * 16)
    assert result["is_spike"] is False
    assert type(result["is_spike"]) is bool
    assert result["z_score"] == 0.0
    assert type(result["z_score"]) is float
    assert result["recent_avg"] == 10.0
    assert type(result["recent_avg"]) is float
    assert result["baseline_avg"] == 10.0
    assert type(result["baseline_avg"]) is float
    assert result["baseline_std"] == 0.0
    assert type(result["baseline_std"]) is float

    # Sequence with known mean, std (sample std ddof=1), and a spike
    seq_spike = list(range(1, 19)) + [100.0, 104.0]
    res_spike = detect_spike(seq_spike)
    assert res_spike["is_spike"] is True
    assert type(res_spike["is_spike"]) is bool
    assert res_spike["z_score"] > SPIKE_Z_THRESHOLD
    assert res_spike["recent_avg"] == 102.0

    # Sequence with no spike
    seq_no_spike = list(range(1, 19)) + [10.0, 11.0]
    res_no_spike = detect_spike(seq_no_spike)
    assert res_no_spike["is_spike"] is False
    assert res_no_spike["z_score"] <= SPIKE_Z_THRESHOLD


def test_detect_spike_test1_normal_data():
    normal_history = [45, 52, 48, 55, 42, 58, 50, 47, 53, 49, 56, 44, 51, 46, 54, 48]
    result = detect_spike(normal_history)
    assert result["is_spike"] is False


def test_detect_spike_test2_spike_data():
    normal_history = [45, 52, 48, 55, 42, 58, 50, 47, 53, 49, 56, 44, 51, 46, 54, 48]
    spiked_history = normal_history[:-2] + [normal_history[-2] * 3, normal_history[-1] * 3]
    result = detect_spike(spiked_history)
    assert result["is_spike"] is True
    assert result["z_score"] > 3



