import math

START_WEEKDAY = 0  # 0 = Monday, 6 = Sunday
SPIKE_Z_THRESHOLD = 3


def get_weekday_factors(history):
    """Calculate the 7 weekday factors (Mon to Sun) from history.

    For each weekday (0=Monday to 6=Sunday), computes the average sales on
    that weekday and divides by the overall average sales across all history.
    If a weekday has no data in history or overall mean is 0, its factor defaults to 1.0.

    Args:
        history (list[float | int]): Historical daily sales numbers, oldest first.

    Returns:
        list[float]: 7 factors corresponding to weekdays 0 (Monday) through 6 (Sunday).
    """
    if not history:
        return [1.0] * 7

    overall_mean = sum(history) / len(history)

    weekday_buckets = [[] for _ in range(7)]
    for i, val in enumerate(history):
        w = (START_WEEKDAY + i) % 7
        weekday_buckets[w].append(val)

    factors = []
    for w in range(7):
        vals = weekday_buckets[w]
        if not vals or overall_mean == 0:
            factors.append(1.0)
        else:
            weekday_mean = sum(vals) / len(vals)
            factors.append(weekday_mean / overall_mean)

    return factors


def forecast_demand(history, days_ahead, event_multiplier=1.0):
    """Forecast future daily demand using a 7-day moving average and weekday factors.
    Args:
        history (list[float|int]): Daily sales numbers (oldest first, len >= 7).
        days_ahead (int): Number of days to forecast (>= 1).
        event_multiplier (float): Demand scaling factor (>= 0, default 1.0).
    Returns:
        list[float]: Forecasted daily sales of length days_ahead.
    Example:
        >>> forecast_demand([10] * 7, 2)
        [10.0, 10.0]
    """
    if len(history) < 7:
        raise ValueError(
            f"'history' must contain at least 7 values, but got {len(history)}."
        )
    if days_ahead < 1:
        raise ValueError(
            f"'days_ahead' must be at least 1, but got {days_ahead}."
        )
    if event_multiplier < 0:
        raise ValueError(
            f"'event_multiplier' must be non-negative, but got {event_multiplier}."
        )

    moving_avg = sum(history[-7:]) / 7.0
    factors = get_weekday_factors(history)

    start_forecast_index = len(history)
    forecasts = []
    for step in range(days_ahead):
        forecast_weekday = (START_WEEKDAY + start_forecast_index + step) % 7
        weekday_factor = factors[forecast_weekday]
        val = moving_avg * weekday_factor * event_multiplier
        forecasts.append(float(val))

    return forecasts


def backtest(history, holdout_days=14):
    """Backtest forecast_demand against the last `holdout_days` of history.

    Hides the last `holdout_days` of history, generates a forecast using
    `forecast_demand` on the remaining training data, and compares it against
    both the actual values and a plain 7-day moving average baseline.

    Args:
        history (list[float | int]): Historical daily sales numbers, oldest first.
        holdout_days (int, optional): Number of recent days to hold out for evaluation.
            Defaults to 14.

    Returns:
        dict: A dictionary containing MAE and MAPE for both the model and the baseline:
            {
                "model": {"mae": float, "mape": float},
                "baseline": {"mae": float, "mape": float}
            }

    Raises:
        ValueError: If ``holdout_days`` is less than 1.
        ValueError: If ``history`` contains fewer than ``holdout_days + 7`` values.
    """
    if holdout_days < 1:
        raise ValueError(
            f"'holdout_days' must be at least 1, but got {holdout_days}."
        )
    if len(history) < holdout_days + 7:
        raise ValueError(
            f"'history' must contain at least {holdout_days + 7} values to backtest "
            f"{holdout_days} holdout days (requires at least 7 training values), "
            f"but got {len(history)}."
        )

    train = history[:-holdout_days]
    actuals = history[-holdout_days:]

    # 1. Weekday-adjusted forecast model
    model_forecast = forecast_demand(train, days_ahead=holdout_days)

    # 2. Plain 7-day moving average baseline
    baseline_ma = sum(train[-7:]) / 7.0
    baseline_forecast = [baseline_ma] * holdout_days

    def _calc_mae(actual_vals, pred_vals):
        return sum(abs(a - p) for a, p in zip(actual_vals, pred_vals)) / len(actual_vals)

    def _calc_mape(actual_vals, pred_vals):
        ape_vals = [
            abs(a - p) / abs(a)
            for a, p in zip(actual_vals, pred_vals)
            if a != 0
        ]
        return (sum(ape_vals) / len(ape_vals) * 100.0) if ape_vals else 0.0

    model_mae = _calc_mae(actuals, model_forecast)
    model_mape = _calc_mape(actuals, model_forecast)

    base_mae = _calc_mae(actuals, baseline_forecast)
    base_mape = _calc_mape(actuals, baseline_forecast)

    print("=== Backtest Evaluation (Last 14 Days) ===")
    print("Baseline (Plain 7-day Moving Average):")
    print(f"Average error (MAE): {base_mae:.2f} units | MAPE: {base_mape:.2f}%\n")
    print("Model (7-day MA + Weekday Factors):")
    print(f"Average error (MAE): {model_mae:.2f} units | MAPE: {model_mape:.2f}%\n")

    return {
        "model": {"mae": model_mae, "mape": model_mape},
        "baseline": {"mae": base_mae, "mape": base_mape},
    }


def detect_spike(history):
    """Detect demand spikes by comparing the last 2 days against a 14-day baseline.
    Args:
        history (list[float|int]): Daily sales numbers (oldest first, len >= 16).
    Returns:
        dict: Keys is_spike (bool), z_score, baseline_avg, baseline_std, recent_avg (floats).
    Example:
        >>> detect_spike([50] * 16)
        {'is_spike': False, 'z_score': 0.0, 'baseline_avg': 50.0, 'baseline_std': 0.0, 'recent_avg': 50.0}
    """
    if len(history) < 16:
        raise ValueError(
            f"'history' must contain at least 16 values (14 baseline days + 2 recent days), "
            f"but got {len(history)}."
        )

    recent = history[-2:]
    baseline = history[-16:-2]

    baseline_avg = float(sum(baseline) / 14.0)
    variance = sum((x - baseline_avg) ** 2 for x in baseline) / 13.0
    baseline_std = float(math.sqrt(variance))

    recent_avg = float(sum(recent) / 2.0)

    if baseline_std > 0.0:
        z_score = float((recent_avg - baseline_avg) / baseline_std)
    else:
        z_score = float("inf") if recent_avg > baseline_avg else 0.0

    is_spike = bool(z_score > SPIKE_Z_THRESHOLD)

    return {
        "is_spike": is_spike,
        "z_score": z_score,
        "baseline_avg": baseline_avg,
        "baseline_std": baseline_std,
        "recent_avg": recent_avg,
    }


# ---------------------------------------------------------------------------
# Tests & Sample Demonstration
# ---------------------------------------------------------------------------

def _run_tests():
    global START_WEEKDAY
    original_start_weekday = START_WEEKDAY

    try:
        START_WEEKDAY = 0

        # Test 1: Flat history — all factors are 1.0, forecast matches constant value
        flat = [5.0] * 7
        factors_flat = get_weekday_factors(flat)
        assert factors_flat == [1.0] * 7, f"Flat factors failed: {factors_flat}"
        result_flat = forecast_demand(flat, days_ahead=3)
        assert result_flat == [5.0, 5.0, 5.0], f"Flat forecast failed: {result_flat}"

        # Test 2: Known weekday pattern over 2 weeks (14 days)
        # Weekdays Mon-Fri = 10, Weekends Sat-Sun = 20
        # Overall mean = (10*10 + 4*20) / 14 = 180 / 14 = 90 / 7
        # Weekday factor (Mon-Fri) = 10 / (90/7) = 7/9
        # Weekend factor (Sat-Sun) = 20 / (90/7) = 14/9
        pattern_14 = [10.0, 10.0, 10.0, 10.0, 10.0, 20.0, 20.0] * 2
        factors_pattern = get_weekday_factors(pattern_14)
        for w in range(5):
            assert abs(factors_pattern[w] - (7.0 / 9.0)) < 1e-9
        for w in range(5, 7):
            assert abs(factors_pattern[w] - (14.0 / 9.0)) < 1e-9

        # Forecast next 3 days: Mon, Tue, Wed -> each should be moving_avg * (7/9) = (90/7)*(7/9) = 10.0
        result_pattern = forecast_demand(pattern_14, days_ahead=3)
        for val in result_pattern:
            assert abs(val - 10.0) < 1e-9

        # Test 3: History longer than 7 days — moving average only takes last 7 days
        # First 7 days huge (1000.0), last 7 days flat (10.0)
        # Verify moving average uses last 7 days (10.0) adjusted by factors
        long_history = [1000.0] * 7 + [10.0] * 7
        # moving_avg is 10.0
        factors_long = get_weekday_factors(long_history)
        result_long = forecast_demand(long_history, days_ahead=7)
        for w in range(7):
            expected = 10.0 * factors_long[w]
            assert abs(result_long[w] - expected) < 1e-9

        # Test 4: Missing weekday data (e.g. fewer than 7 days in helper check)
        partial = [10.0, 20.0, 30.0]  # Only Mon, Tue, Wed have data
        partial_factors = get_weekday_factors(partial)
        for w in range(3, 7):
            assert partial_factors[w] == 1.0, f"Unobserved weekday {w} factor should be 1.0"

        # Test 5: Event multiplier tests
        test_history = [10.0, 12.0, 15.0, 14.0, 20.0, 25.0, 18.0]
        base_forecast = forecast_demand(test_history, days_ahead=4)
        forecast_1_0 = forecast_demand(test_history, days_ahead=4, event_multiplier=1.0)
        assert forecast_1_0 == base_forecast, f"Multiplier 1.0 must equal no-event forecast: {forecast_1_0} vs {base_forecast}"

        forecast_2_0 = forecast_demand(test_history, days_ahead=4, event_multiplier=2.0)
        for base_val, doubled_val in zip(base_forecast, forecast_2_0):
            assert abs(doubled_val - 2.0 * base_val) < 1e-9, f"Multiplier 2.0 must double every value: {doubled_val} vs {2.0 * base_val}"

        forecast_0_5 = forecast_demand(test_history, days_ahead=4, event_multiplier=0.5)
        for base_val, halved_val in zip(base_forecast, forecast_0_5):
            assert abs(halved_val - 0.5 * base_val) < 1e-9, f"Multiplier 0.5 must halve every value: {halved_val} vs {0.5 * base_val}"

        # Rejection of negative multiplier
        try:
            forecast_demand(test_history, days_ahead=4, event_multiplier=-0.5)
            assert False, "Expected ValueError for negative event_multiplier"
        except ValueError:
            pass

        # Test 6: Backtest tests
        # Flat history has 0 error for both
        flat_backtest_hist = [10.0] * 21
        flat_metrics = backtest(flat_backtest_hist, holdout_days=14)
        assert abs(flat_metrics["model"]["mae"]) < 1e-9
        assert abs(flat_metrics["baseline"]["mae"]) < 1e-9

        # Seasonal pattern where model significantly beats baseline
        seasonal_28 = [
            100.0, 100.0, 100.0, 100.0, 100.0, 200.0, 200.0,
            100.0, 100.0, 100.0, 100.0, 100.0, 200.0, 200.0,
            100.0, 100.0, 100.0, 100.0, 100.0, 200.0, 200.0,
            100.0, 100.0, 100.0, 100.0, 100.0, 200.0, 200.0,
        ]
        seasonal_metrics = backtest(seasonal_28, holdout_days=14)
        assert seasonal_metrics["model"]["mae"] < seasonal_metrics["baseline"]["mae"]
        assert seasonal_metrics["model"]["mape"] < seasonal_metrics["baseline"]["mape"]

        # Backtest error validation: history too short
        try:
            backtest([10.0] * 20, holdout_days=14)
            assert False, "Expected ValueError when history < holdout + 7"
        except ValueError:
            pass

        # Backtest error validation: holdout_days < 1
        try:
            backtest([10.0] * 21, holdout_days=0)
            assert False, "Expected ValueError when holdout_days < 1"
        except ValueError:
            pass

        # Test 7: detect_spike finalized calculation and types
        flat_16 = [10.0] * 16
        spike_res_flat = detect_spike(flat_16)
        assert spike_res_flat["is_spike"] is False
        assert type(spike_res_flat["is_spike"]) is bool
        assert spike_res_flat["z_score"] == 0.0
        assert type(spike_res_flat["z_score"]) is float
        assert spike_res_flat["recent_avg"] == 10.0
        assert type(spike_res_flat["recent_avg"]) is float
        assert spike_res_flat["baseline_avg"] == 10.0
        assert type(spike_res_flat["baseline_avg"]) is float
        assert spike_res_flat["baseline_std"] == 0.0
        assert type(spike_res_flat["baseline_std"]) is float

        # Sample with known variance and a strong spike
        sample_seq = list(range(1, 19)) + [100.0, 104.0]  # baseline [3..16], recent [100, 104] (avg 102)
        spike_seq = detect_spike(sample_seq)
        assert spike_seq["is_spike"] is True
        assert type(spike_seq["is_spike"]) is bool
        assert spike_seq["z_score"] > SPIKE_Z_THRESHOLD
        assert spike_seq["recent_avg"] == 102.0

        # Test 1 (normal data): 16 values varying between about 40 and 60
        normal_history = [45, 52, 48, 55, 42, 58, 50, 47, 53, 49, 56, 44, 51, 46, 54, 48]
        normal_result = detect_spike(normal_history)
        assert normal_result["is_spike"] is False, f"Expected is_spike to be False for normal data, got {normal_result}"

        # Test 2 (spike): same history with last 2 values multiplied by 3
        spiked_history = normal_history[:-2] + [normal_history[-2] * 3, normal_history[-1] * 3]
        spiked_result = detect_spike(spiked_history)
        assert spiked_result["is_spike"] is True, f"Expected is_spike to be True for spiked data, got {spiked_result}"
        assert spiked_result["z_score"] > 3, f"Expected z_score > 3, got {spiked_result['z_score']}"

        try:
            detect_spike([10.0] * 15)
            assert False, "Expected ValueError when history < 16 for detect_spike"
        except ValueError:
            pass

        print("All tests passed.\n")

        print("=== detect_spike Tests Output ===")
        print("\n--- Test 1 (Normal Data) ---")
        print(f"History (16 values): {normal_history}")
        print("Returned Dictionary:")
        print(normal_result)
        for k, v in normal_result.items():
            print(f"  {k}: {v}")

        print("\n--- Test 2 (Spike: Recent Values x 3) ---")
        print(f"History (16 values): {spiked_history}")
        print("Returned Dictionary:")
        print(spiked_result)
        for k, v in spiked_result.items():
            print(f"  {k}: {v}")

        # Sample demonstration
        sample_sales = [
            120, 115, 130, 125, 180, 240, 210,  # Week 1 (Mon-Sun)
            110, 120, 128, 135, 195, 255, 220,  # Week 2 (Mon-Sun)
            115, 118, 132, 130, 185, 245, 215,  # Week 3 (Mon-Sun)
            122, 116, 129, 134, 190, 250, 218,  # Week 4 (Mon-Sun)
        ]
        sample_factors = get_weekday_factors(sample_sales)
        weekday_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

        print("Sample Data Weekday Factors (Oldest to Newest, Mon=0):")
        print("-" * 45)
        for name, factor in zip(weekday_names, sample_factors):
            print(f"  {name:<10}: {factor:.4f}")
        print("-" * 45)

        forecast_3 = forecast_demand(sample_sales, days_ahead=3)
        print(f"Next 3 days forecast (Mon, Tue, Wed): {[round(x, 2) for x in forecast_3]}\n")

        # Run backtest demonstration
        print("Running Backtest on 4-week sample dataset:")
        backtest(sample_sales, holdout_days=14)

        # Baseline slice inspection for detect_spike
        sample_check = [
            10, 11, 12, 13,                                              # 4 older days (ignored)
            14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27,      # 14 baseline days
            99, 105                                                      # 2 recent days
        ]
        print("\n--- detect_spike Baseline Slice Inspection ---")
        print(f"Full input list (len={len(sample_check)}): {sample_check}")
        print(f"Baseline slice (history[-16:-2], len={len(sample_check[-16:-2])}): {sample_check[-16:-2]}")
        print(f"Recent slice   (history[-2:],    len={len(sample_check[-2:])}): {sample_check[-2:]}")
        check_res = detect_spike(sample_check)
        print(f"Computed baseline_avg: {check_res['baseline_avg']:.2f}")
        print(f"Computed baseline_std (sample std, ddof=1): {check_res['baseline_std']:.4f}")
        print(f"Computed recent_avg:   {check_res['recent_avg']:.2f}")
        print(f"Computed z_score:      {check_res['z_score']:.2f}")
        print(f"is_spike (z > {SPIKE_Z_THRESHOLD}):         {check_res['is_spike']}")

    finally:
        START_WEEKDAY = original_start_weekday


if __name__ == "__main__":
    _run_tests()
