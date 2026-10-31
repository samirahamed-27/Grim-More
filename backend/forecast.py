"""
Potion Pantry - Forecasting Module Compatibility Alias
Re-exports forecasting functions from backend/forecasting.py to guarantee strict contract compatibility
with docs/contract.md specifications.
"""

from backend.forecasting import (
    START_WEEKDAY,
    get_weekday_factors,
    forecast_demand,
    backtest,
)

__all__ = [
    "START_WEEKDAY",
    "get_weekday_factors",
    "forecast_demand",
    "backtest",
]
