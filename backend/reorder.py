"""
Potion Pantry - Inventory Reorder Calculator (backend/reorder.py)
Pure function module that computes safety stock, target stock, replenishment order quantities,
days of cover, and urgency statuses based on demand forecast and supplier lead times.
"""

import math
from typing import Any, Dict


def calculate_reorder(
    daily_forecast: float,
    std: float,
    lead_time_days: int,
    cover_days: int,
    current_stock: int,
) -> Dict[str, Any]:
    """
    Computes inventory replenishment order requirements using standard supply chain formulas.

    Formula 1 (Safety Stock):
        Extra buffer units to absorb random demand fluctuations with 95% service level (Z = 1.65).
        Formula: 1.65 * std * sqrt(lead_time_days)

    Formula 2 (Target Stock):
        Total units needed to cover demand during supplier delivery plus target buffer window, plus safety stock.
        Formula: daily_forecast * (lead_time_days + cover_days) + safety_stock

    Formula 3 (Order Quantity):
        Units to reorder immediately; never negative.
        Formula: max(0, round(target_stock - current_stock))

    Formula 4 (Days of Cover):
        Number of operating days existing shelf inventory will last at current forecasted daily demand.
        Formula: current_stock / daily_forecast (returns 999.0 if daily_forecast is zero)

    Formula 5 (Status):
        Urgency classification based on unrounded days of cover:
        - "critical" if days_of_cover < lead_time_days (guaranteed stockout before delivery arrives!)
        - "watch" if days_of_cover < lead_time_days + 2 (tight inventory approaching danger)
        - "ok" otherwise (healthy buffer)

    Formula 6 (Priority):
        Action urgency mapped from status: "critical" -> "high", "watch" -> "medium", "ok" -> "low".
    """
    # Sanitize inputs for robustness against negative values and edge cases
    df = max(0.0, float(daily_forecast))
    s = max(0.0, float(std))
    lt = max(0, int(lead_time_days))
    cov = max(0, int(cover_days))
    stock = max(0, int(current_stock))

    # 1. Safety stock calculation: 95% service level factor (1.65) times volatility over lead time
    safety_stock_exact = 1.65 * s * math.sqrt(lt)

    # 2. Target stock calculation: expected sales over lead + cover period, plus safety buffer
    target_stock_exact = df * (lt + cov) + safety_stock_exact

    # 3. Order quantity calculation: gap between target requirement and current stock
    order_qty = max(0, int(round(target_stock_exact - stock)))

    # 4. Days of cover calculation: shelf life of current stock at forecast rate
    if df == 0.0:
        days_of_cover_exact = 999.0
    else:
        days_of_cover_exact = stock / df

    # 5. Status determination evaluated using UNROUNDED days of cover
    if days_of_cover_exact < float(lt):
        status = "critical"
    elif days_of_cover_exact < float(lt + 2):
        status = "watch"
    else:
        status = "ok"

    # 6. Priority mapping from status
    if status == "critical":
        priority = "high"
    elif status == "watch":
        priority = "medium"
    else:
        priority = "low"

    # Round displayed values per contract specification (whole numbers for units, 1 decimal for cover)
    return {
        "safety_stock": int(round(safety_stock_exact)),
        "target_stock": int(round(target_stock_exact)),
        "order_qty": order_qty,
        "days_of_cover": round(days_of_cover_exact, 1) if days_of_cover_exact != 999.0 else 999.0,
        "status": status,
        "priority": priority,
    }
