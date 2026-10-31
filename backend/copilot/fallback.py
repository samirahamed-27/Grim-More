"""
Potion Pantry - Deterministic Offline Fallback Router (backend/copilot/fallback.py)

Operates with zero LLM and zero network dependencies.
Guarantees reliable, predictable answers for core operational questions:
1. "What is the status of my shop?"
2. "Which ingredients will run out before Friday?" (anchored to demo_today)
3. "What happens if the Wolfsbane courier is delayed by 3 days?"
4. "Is there a festival coming up and when should I order?"
5. "Simulate a surge" -> returns pending_action card requiring user confirmation.
"""

import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

from backend.copilot.tools import (
    execute_get_inventory_status,
    execute_get_alerts,
    execute_get_reorders,
    execute_get_forecast,
    execute_get_upcoming_festivals,
    execute_get_simulation,
    execute_check_runout_before,
    execute_whatif_supplier_delay,
    get_demo_today_str,
)


WEEKDAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

INGREDIENT_MAP = {
    "moonflower": 1,
    "silver dew": 2,
    "wolfsbane": 3,
    "dragon resin": 4,
    "nightshade": 5,
    "mandrake root": 6,
    "mandrake": 6,
}


def resolve_date_reference(text: str, base_date_str: str) -> Tuple[str, str]:
    """
    Resolves relative date words like 'Friday', 'tomorrow', 'next week'
    against the synthetic base_date_str (demo_today).
    Returns (resolved_date_iso, explanation_label).
    """
    text_lower = text.lower()
    base_dt = datetime.strptime(base_date_str, "%Y-%m-%d")

    # Explicit ISO date YYYY-MM-DD
    iso_match = re.search(r"\b(202\d-\d{2}-\d{2})\b", text)
    if iso_match:
        return iso_match.group(1), iso_match.group(1)

    # Tomorrow
    if "tomorrow" in text_lower:
        resolved = base_dt + timedelta(days=1)
        return resolved.strftime("%Y-%m-%d"), f"tomorrow ({resolved.strftime('%Y-%m-%d')})"

    # Weekdays
    for idx, day_name in enumerate(WEEKDAYS):
        if re.search(rf"\b{day_name}\b", text_lower):
            current_day_idx = base_dt.weekday()
            offset = (idx - current_day_idx) % 7
            if offset == 0:
                offset = 7
            resolved = base_dt + timedelta(days=offset)
            res_str = resolved.strftime("%Y-%m-%d")
            return res_str, f"{day_name.capitalize()} ({res_str})"

    # Default to 7 days ahead
    resolved = base_dt + timedelta(days=7)
    return resolved.strftime("%Y-%m-%d"), f"next 7 days ({resolved.strftime('%Y-%m-%d')})"


def route_offline_intent(
    query: str,
    create_token_callback,
) -> Dict[str, Any]:
    """
    Parses user query into intent and executes the corresponding tools offline.
    Returns standard copilot response dictionary with mode='offline'.
    """
    query_clean = query.strip()
    query_lower = query_clean.lower()
    demo_today_str = get_demo_today_str()
    demo_today_dt = datetime.strptime(demo_today_str, "%Y-%m-%d")
    demo_weekday = demo_today_dt.strftime("%A")

    # 1. Mutating: Simulate Surge / Spike
    if "simulate" in query_lower and ("surge" in query_lower or "spike" in query_lower):
        summary = "Simulate a sudden 3x demand surge for Moonflower, Silver Dew, and Wolfsbane for the next 2 days."
        token = create_token_callback(
            tool_name="simulate_surge",
            args={},
            summary=summary,
        )
        return {
            "reply": (
                f"I have prepared a proposal to simulate a sudden 3x demand surge on Moonflower, Silver Dew, and Wolfsbane "
                f"starting from demo date {demo_today_str}. As this is a mutating operational action, please review and confirm below."
            ),
            "mode": "offline",
            "tools_used": [{"name": "simulate_surge", "args": {}}],
            "pending_action": {
                "token": token,
                "tool": "simulate_surge",
                "args": {},
                "summary": summary,
                "expires_in": 120,
            },
            "sources": ["simulate_spike"],
        }

    # 2. Mutating: Reset Demo
    if re.search(r"\breset\b", query_lower):
        summary = "Reset demo database back to clean baseline state (clears surges, events, and reorders)."
        token = create_token_callback(
            tool_name="reset_demo",
            args={},
            summary=summary,
        )
        return {
            "reply": "I have prepared a proposal to reset all sales, events, and reorder tables back to baseline. Please confirm below.",
            "mode": "offline",
            "tools_used": [{"name": "reset_demo", "args": {}}],
            "pending_action": {
                "token": token,
                "tool": "reset_demo",
                "args": {},
                "summary": summary,
                "expires_in": 120,
            },
            "sources": ["reset"],
        }

    # 3. Demo Question 2: Run out before <Date/Weekday>
    if "run out" in query_lower or "runs out" in query_lower or "stockout before" in query_lower:
        resolved_date, date_label = resolve_date_reference(query_clean, demo_today_str)
        runout_res = execute_check_runout_before(resolved_date)

        lines = [
            f"Based on our reference date {demo_today_str} ({demo_weekday}), evaluating stock through {date_label}:",
            runout_res["summary"],
        ]
        if runout_res["ingredients_running_out_count"] > 0:
            for ing in runout_res["ingredients"]:
                if ing["runs_out_before"]:
                    lines.append(
                        f"• {ing['name']}: runs out on {ing['runout_date']} (in {ing['days_until_runout']} days; cover is {ing['days_of_cover']}d)."
                    )
        else:
            lines.append("Current days of cover for all ingredients:")
            for ing in runout_res["ingredients"]:
                lines.append(f"• {ing['name']}: {ing['days_of_cover']} days of cover (stock: {ing['current_stock']:,}).")

        lines.append(f"\nBased on: check_runout_before, ingredients (Target: {resolved_date})")

        return {
            "reply": "\n".join(lines),
            "mode": "offline",
            "tools_used": [{"name": "check_runout_before", "args": {"date": resolved_date}}],
            "pending_action": None,
            "sources": ["check_runout_before", "ingredients"],
        }

    # 4. Demo Question 3: Supplier Delay What-If
    if "delay" in query_lower or "courier" in query_lower:
        # Determine extra days
        days_match = re.search(r"(\d+)\s*(?:day|days)", query_lower)
        extra_days = int(days_match.group(1)) if days_match else 3

        # Determine target ingredient
        target_ing_id: Union[int, str] = "all"
        for name, ing_id in INGREDIENT_MAP.items():
            if name in query_lower:
                target_ing_id = ing_id
                break

        delay_res = execute_whatif_supplier_delay(ingredient_id=target_ing_id, extra_lead_days=extra_days)
        lines = [
            f"Supplier Delay What-If Simulation (+{extra_days} days):",
            delay_res["summary"],
            "",
            "Detailed impact:",
        ]
        for ing in delay_res["ingredients"]:
            stockout_txt = (
                f"STOCKOUT on day {ing['stockout_day']} ({ing['units_short']:,} units short)"
                if ing["stockout_occurs"]
                else "No stockout"
            )
            lines.append(
                f"• {ing['name']}: Lead time {ing['original_lead_time_days']}d ➔ {ing['delayed_lead_time_days']}d. "
                f"Status: {ing['original_status']} ➔ {ing['delayed_status']}. "
                f"Order qty: {ing['original_order_qty']:,} ➔ {ing['delayed_order_qty']:,}. ({stockout_txt})"
            )

        lines.append("\nBased on: whatif_supplier_delay, simulation (Lead Time + Delay)")

        return {
            "reply": "\n".join(lines),
            "mode": "offline",
            "tools_used": [
                {
                    "name": "whatif_supplier_delay",
                    "args": {"ingredient_id": str(target_ing_id), "extra_lead_days": extra_days},
                }
            ],
            "pending_action": None,
            "sources": ["whatif_supplier_delay", "simulation"],
        }

    # 5. Demo Question 4: Festival / Full Moon / When to Order
    if "festival" in query_lower or "moon" in query_lower or "calendar" in query_lower:
        calendar_res = execute_get_upcoming_festivals(30)
        if not calendar_res:
            reply = f"No festivals or astronomical full moons are scheduled within the next 30 days from demo date {demo_today_str}."
        else:
            first_moon = calendar_res[0]
            event = first_moon["suggested_event"]
            lines = [
                f"Upcoming Astronomical Event: {event['name']} on {first_moon['date']} (in {first_moon['days_until']} days).",
                f"Projected demand multiplier: {event['multiplier']}x across ingredients 1, 2, and 3.",
                "",
                "Recommended order-by deadlines (calculated using supplier lead times):",
            ]
            for ing in first_moon["ingredients"]:
                lines.append(
                    f"• {ing['name']} (Lead time: {ing['lead_time_days']}d): Order by {ing['order_by_date']} to arrive before festival."
                )
            lines.append("\nBased on: calendar/upcoming, moon_calendar")
            reply = "\n".join(lines)

        return {
            "reply": reply,
            "mode": "offline",
            "tools_used": [{"name": "get_upcoming_festivals", "args": {"days": 30}}],
            "pending_action": None,
            "sources": ["calendar/upcoming", "moon_calendar"],
        }

    # 6. Reorders
    if "reorder" in query_lower or "need to order" in query_lower or "order list" in query_lower:
        reorders = execute_get_reorders()
        criticals = [r for r in reorders if r["status"] == "critical"]
        watches = [r for r in reorders if r["status"] == "watch"]
        lines = [f"Reorder Recommendations (Demo date: {demo_today_str}):"]
        if not criticals and not watches:
            lines.append("All ingredients are currently well stocked! No urgent reorders required.")
        else:
            for r in reorders:
                if r["order_qty"] > 0 or r["status"] != "ok":
                    lines.append(
                        f"• {r['name']}: Status [{r['status'].upper()}] - Cover {r['stockout_in_days']}d. "
                        f"Order {r['order_qty']:,} units (Stock: {r['in_stock']:,} / Target: {r['needed']:,})."
                    )
        lines.append("\nBased on: reorders")
        return {
            "reply": "\n".join(lines),
            "mode": "offline",
            "tools_used": [{"name": "get_reorders", "args": {}}],
            "pending_action": None,
            "sources": ["reorders"],
        }

    # 7. Alerts
    if "alert" in query_lower or "warning" in query_lower:
        alerts = execute_get_alerts()
        if not alerts:
            reply = f"No active alerts! All ingredients are healthy as of {demo_today_str}."
        else:
            lines = [f"Active Alerts ({len(alerts)} items):"]
            for a in alerts:
                lines.append(f"• [{a['status'].upper()}] {a['name']}: {a['message']}")
            lines.append("\nBased on: alerts")
            reply = "\n".join(lines)

        return {
            "reply": reply,
            "mode": "offline",
            "tools_used": [{"name": "get_alerts", "args": {}}],
            "pending_action": None,
            "sources": ["alerts"],
        }

    # 8. Demo Question 1 / Default: Shop Status
    # Matches "status of my shop", "how are we doing", "inventory", or any general inquiry
    ings = execute_get_inventory_status()
    alerts = execute_get_alerts()

    critical_count = sum(1 for i in ings if i["status"] == "critical")
    watch_count = sum(1 for i in ings if i["status"] == "watch")

    if critical_count == 0 and watch_count == 0:
        health_summary = "All 6 ingredients are currently healthy (OK) with comfortable days of cover."
    else:
        health_summary = f"Attention required: {critical_count} critical and {watch_count} watch items."

    lines = [
        f"Shop Inventory Status (Demo Date: {demo_today_str}, {demo_weekday}):",
        health_summary,
        "",
        "Current Ingredients Overview:",
    ]
    for ing in ings:
        badge = ing["status"].upper()
        lines.append(
            f"• {ing['name']}: {ing['current_stock']:,} in stock | Forecast {ing['daily_forecast']} units/day | "
            f"Cover: {ing['days_of_cover']}d | Status: [{badge}]"
        )

    if alerts:
        lines.append(f"\nActive Alerts ({len(alerts)}):")
        for a in alerts[:2]:
            lines.append(f"⚠️ {a['name']}: {a['message']}")

    lines.append("\nBased on: ingredients, alerts")

    return {
        "reply": "\n".join(lines),
        "mode": "offline",
        "tools_used": [
            {"name": "get_inventory_status", "args": {}},
            {"name": "get_alerts", "args": {}},
        ],
        "pending_action": None,
        "sources": ["ingredients", "alerts"],
    }
