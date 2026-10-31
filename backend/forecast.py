"""
Potion Pantry - Forecasting Module Compatibility Alias
Re-exports forecasting functions from backend/forecasting.py to guarantee strict contract compatibility
with docs/contract.md specifications.
"""

from backend.forecasting import (
    SPIKE_Z_THRESHOLD,
    START_WEEKDAY,
    get_weekday_factors,
    forecast_demand,
    backtest,
    detect_spike,
)

__all__ = [
    "SPIKE_Z_THRESHOLD",
    "START_WEEKDAY",
    "get_weekday_factors",
    "forecast_demand",
    "backtest",
    "detect_spike",
]

