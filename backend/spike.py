"""
Potion Pantry - Spike Detection Engine (backend/spike.py)
Identifies sudden anomalous demand surges using statistical Z-score analysis.
Strictly adheres to docs/contract.md specifications.
"""

import math
from typing import Any, Dict, List


def detect_spike(history: List[int | float]) -> Dict[str, Any]:
    """
    Detects whether recent demand represents an anomalous surge (spike) using Z-score.

    Baseline: The 14 days before the last 2 days.
    Recent: The average of the most recent 2 days.
    Anomaly Score: z = (recent_avg - baseline_avg) / baseline_std.
    Flag: is_spike = True if z > 3.0 (over 3 standard deviations from normal).

    Args:
        history (List[int | float]): Chronological sequence of daily sales units (oldest first).

    Returns:
        Dict[str, Any]: {
            "is_spike": bool,
            "z_score": float,
            "baseline_avg": float,
            "baseline_std": float,
            "recent_avg": float
        }
    """
    # Requires at least 16 days (14 baseline days + 2 recent days)
    if not history or len(history) < 16:
        recent_window = history[-2:] if len(history) >= 2 else history
        recent_avg = sum(recent_window) / len(recent_window) if recent_window else 0.0
        return {
            "is_spike": False,
            "z_score": 0.0,
            "baseline_avg": round(float(recent_avg), 2),
            "baseline_std": 0.0,
            "recent_avg": round(float(recent_avg), 2),
        }

    # 1. Recent window: last 2 days
    recent_window = history[-2:]
    recent_avg = sum(recent_window) / 2.0

    # 2. Baseline window: 14 days before the last 2 days
    baseline_window = history[-16:-2]
    n = len(baseline_window)
    baseline_avg = sum(baseline_window) / float(n)

    # 3. Baseline standard deviation (sample standard deviation with Bessel's correction)
    variance = sum((x - baseline_avg) ** 2 for x in baseline_window) / float(n - 1)
    baseline_std = math.sqrt(variance)

    # 4. Z-Score calculation with guard against zero standard deviation
    if baseline_std < 1e-6:
        if recent_avg > baseline_avg:
            z_score = 99.0
            is_spike = True
        else:
            z_score = 0.0
            is_spike = False
    else:
        z_score = (recent_avg - baseline_avg) / baseline_std
        is_spike = bool(z_score > 3.0)

    return {
        "is_spike": is_spike,
        "z_score": round(float(z_score), 2),
        "baseline_avg": round(float(baseline_avg), 2),
        "baseline_std": round(float(baseline_std), 2),
        "recent_avg": round(float(recent_avg), 2),
    }
