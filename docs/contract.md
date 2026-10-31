# Potion Pantry System Contract

This contract defines the shared database schema, API specification, and Python function signatures.
**Rule**: No teammate modifies field names, table columns, or function signatures without team agreement.

---

## 1. Database Tables (Owned by Person B)

### `ingredients`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY | Product ID (1 to 6) |
| `name` | TEXT NOT NULL | Ingredient display name |
| `current_stock` | INTEGER NOT NULL | Units currently on the shelf |
| `lead_time_days` | INTEGER NOT NULL | Days for supplier shipment to arrive |
| `cover_days` | INTEGER NOT NULL | Safety buffer days desired after delivery |

### `sales`
| Column | Type | Description |
|---|---|---|
| `date` | TEXT NOT NULL | Date string (YYYY-MM-DD) |
| `ingredient_id` | INTEGER NOT NULL | Foreign key to `ingredients.id` |
| `units` | INTEGER NOT NULL | Number of units sold on that date |

### `events`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Event ID |
| `name` | TEXT NOT NULL | Event name (e.g. "Full Moon Festival") |
| `ingredient_ids` | TEXT NOT NULL | Comma-separated IDs (e.g., "1,2,3") or JSON array string |
| `multiplier` | REAL NOT NULL | Demand multiplier (e.g., 3.0) |
| `start_date` | TEXT NOT NULL | Event start date (YYYY-MM-DD) |
| `end_date` | TEXT NOT NULL | Event end date (YYYY-MM-DD) |

### `reorders`
| Column | Type | Description |
|---|---|---|
| `id` | INTEGER PRIMARY KEY AUTOINCREMENT | Reorder record ID |
| `ingredient_id` | INTEGER NOT NULL | Foreign key to `ingredients.id` |
| `order_qty` | INTEGER NOT NULL | Recommended order quantity |
| `priority` | TEXT NOT NULL | Priority level: `"low"`, `"medium"`, `"high"` |
| `created_at` | TEXT NOT NULL | Timestamp when suggestion was generated |

---

## 2. API URLs (Person B builds, Person C calls)

### Allowed Status & Priority Values
- **Status values**: `"ok"` (green), `"watch"` (yellow), `"critical"` (red)
- **Priority values**: `"low"`, `"medium"`, `"high"`

### Endpoints

#### `GET /api/ingredients`
- **Description**: List all 6 ingredients with current stock, lead time, daily forecast, days of cover, reorder recommendation, and status.
- **Returns**: Array of objects:
```json
[
  {
    "id": 1,
    "name": "Moonflower",
    "current_stock": 400,
    "lead_time_days": 2,
    "daily_forecast": 300,
    "days_of_cover": 1.3,
    "status": "critical",
    "order_qty": 1170,
    "priority": "high"
  }
]
```

#### `GET /api/forecast/{id}`
- **Description**: History and 14-day forward forecast for one ingredient, plus spike detection metadata.
- **Horizon**: Returns 14 days (first 7 remain identical to prior releases for backward compatibility).
- **Event Tagging**: Each forecast day includes boolean `in_event_window` indicating active festival coverage.
- **Returns**:
```json
{
  "ingredient_id": 1,
  "name": "Moonflower",
  "history": [
    {"date": "2023-12-30", "units": 98},
    {"date": "2023-12-31", "units": 103}
  ],
  "forecast": [
    {"date": "2024-01-02", "units": 602.2, "lower": 365.7, "upper": 838.7, "in_event_window": false},
    {"date": "2024-01-08", "units": 1488.1, "lower": 1251.6, "upper": 1724.6, "in_event_window": true}
  ],
  "spike": {
    "is_spike": false,
    "z_score": -1.23,
    "baseline_avg": 695.8,
    "baseline_std": 236.5,
    "recent_avg": 406.0
  }
}
```

#### `POST /api/event`
- **Description**: Announce an upcoming festival or demand event.
- **Request Body**:
```json
{
  "name": "Full Moon Festival",
  "ingredient_ids": [1, 2, 3],
  "multiplier": 3.0,
  "start_date": "2024-01-08",
  "end_date": "2024-01-14"
}
```
- **Returns**: Updated ingredients list or confirmation with new forecasts.

#### `POST /api/simulate-spike`
- **Description**: Demo button — injects sudden surge (e.g. 2 days of 3x sales for ingredients 1-3) into the dataset so the spike detector catches it live.
- **Returns**:
```json
{
  "message": "Festival demand spike simulated successfully",
  "affected_ingredients": [1, 2, 3],
  "ingredients": [...],
  "reorders": [...]
}
```

#### `GET /api/reorders`
- **Description**: Current reorder suggestions, sorted with the most urgent items first.
- **Returns**: Array of reorder suggestions:
```json
[
  {
    "ingredient_id": 1,
    "name": "Moonflower",
    "needed": 1570,
    "in_stock": 400,
    "order_qty": 1170,
    "priority": "high",
    "status": "critical",
    "stockout_in_days": 1.3
  }
]
```

#### `GET /api/alerts`
- **Description**: Active actionable alerts for ingredients in `critical` or `watch` status, ranked by urgency. Returns empty array `[]` when all ingredients are healthy.
- **Round 4 Enhancements**:
  - `days_of_cover`: Strictly floored down to 1 decimal place across all items and synchronized with message text.
  - Festival alerts include `days_until_event`, `order_by_date` (start_date minus lead_time_days), and `display_status: "upcoming"`.
- **Returns**: Array of alerts:
```json
[
  {
    "ingredient_id": 1,
    "name": "Moonflower",
    "status": "watch",
    "priority": "medium",
    "days_of_cover": 6.0,
    "lead_time_days": 2,
    "order_qty": 6641,
    "alert_type": "festival",
    "days_until_event": 6,
    "order_by_date": "2024-01-06",
    "display_status": "upcoming",
    "message": "📅 FESTIVAL ANNOUNCEMENT: 'Solstice Gala' scheduled for 2024-01-08. Demand multiplier is 3.0x. Order 6,641 units by 2024-01-06 ahead of time so shipment arrives before the festival."
  }
]
```

#### `GET /api/simulate/{id}`
- **Description**: 14-day forward simulation comparing day-by-day inventory trajectories across 3 strategic scenarios:
  1. `do_nothing`: No purchase orders placed; inventory depletes to 0 on stockout day.
  2. `order_now`: Purchase order placed today; delivery arrives on day `lead_time`. If cover is less than lead time, reveals the temporary stockout gap.
  3. `ordered_ahead`: Proactive purchase order placed in advance for an announced festival, completely avoiding stockouts.
- **Evaluation Order**: Each day evaluates: Starting Morning Stock -> Demand Subtracted -> Delivery Added -> Evening Stock.
- **Returns**:
```json
{
  "ingredient_id": 1,
  "name": "Moonflower",
  "current_stock": 3984,
  "lead_time_days": 2,
  "daily_evaluation_order": "1. Morning Stock -> 2. Daily Demand Subtracted -> 3. Delivery Received -> 4. Evening Stock",
  "scenarios": {
    "do_nothing": {
      "stockout_day": 2,
      "units_short": 23876,
      "timeline": [{"day": 1, "date": "2024-01-02", "demand": 1993, "delivery": 0, "end_stock": 1991, "stockout": false}, ...]
    },
    "order_now": {
      "order_qty": 6587,
      "arrival_day": 2,
      "stockout_day": 2,
      "units_short": 2,
      "timeline": [{"day": 1, "date": "2024-01-02", "demand": 1993, "delivery": 0, "end_stock": 1991, "stockout": false}, ...]
    },
    "ordered_ahead": {
      "order_qty": 6587,
      "arrival_day": 1,
      "stockout_day": null,
      "units_short": 0,
      "timeline": [{"day": 1, "date": "2024-01-02", "demand": 1993, "delivery": 6587, "end_stock": 8578, "stockout": false}, ...]
    }
  },
  "summary": "Without reordering, Moonflower runs out on day 2. Ordering now still leaves a brief 2 unit shortage because lead time (2d) equals cover. Ordering ahead completely prevents stockout."
}
```

#### `POST /api/sales`
- **Description**: Records daily sales for an ingredient, keeping contiguous history and returning real-time updated forecast, spike, and reorder state.
- **Production Note**: Requires API key authentication (`X-API-Key` or Bearer token) in production deployments.
- **Request Body**:
```json
{
  "ingredient_id": 1,
  "date": "2024-01-02",
  "units": 500
}
```
- **Returns**:
```json
{
  "message": "Recorded 500 units for Moonflower on 2024-01-02 (created). Day total: 500 units.",
  "action": "created",
  "ingredient_id": 1,
  "name": "Moonflower",
  "date": "2024-01-02",
  "units": 500,
  "added_units": 500,
  "current_forecast": 664.1,
  "daily_forecast": 664.1,
  "spike_info": {
    "is_spike": false,
    "z_score": -0.85,
    "baseline_avg": 695.8,
    "baseline_std": 236.5,
    "recent_avg": 481.5
  },
  "days_of_cover": 6.0,
  "status": "ok",
  "order_qty": 0,
  "priority": "low",
  "state": { ... }
}
```

#### `POST /api/sales/batch`
- **Description**: Ingests multiple daily sales records in an atomic, all-or-nothing transaction in chronological order.
- **Request Body**: Array of sale objects (or `{"sales": [...]}`):
```json
[
  {"ingredient_id": 1, "date": "2024-01-02", "units": 500},
  {"ingredient_id": 2, "date": "2024-01-02", "units": 600}
]
```
- **Returns**:
```json
{
  "message": "Successfully processed 2 sales records in atomic batch.",
  "records_processed": 2,
  "results": [
    {"ingredient_id": 1, "date": "2024-01-02", "action": "created", "total_units": 500, "added_units": 500},
    {"ingredient_id": 2, "date": "2024-01-02", "action": "created", "total_units": 600, "added_units": 600}
  ],
  "affected_ingredients": [ ... ]
}
```

#### `GET /api/calendar/upcoming`
- **Description**: Returns upcoming astronomical full moons within the given window (default: 30 days) from `demo_today`.
- **Query Parameters**:
  - `days`: Window length in days (default: 30).
  - `today`: Optional ISO override date (`YYYY-MM-DD`). Defaults to `latest_sales_date + 1 day`.
- **Returns**: Array of upcoming full moon advisories with prefilled `suggested_event` ready for `POST /api/event`:
```json
[
  {
    "date": "2024-01-25",
    "days_until": 23,
    "suggested_event": {
      "name": "Full Moon Festival",
      "ingredient_ids": [1, 2, 3],
      "multiplier": 3.0,
      "start_date": "2024-01-25",
      "end_date": "2024-01-27"
    },
    "ingredients": [
      {
        "ingredient_id": 1,
        "name": "Moonflower",
        "lead_time_days": 2,
        "order_by_date": "2024-01-23",
        "message": "Full Moon on 2024-01-25 (in 23 days). Announce the Full Moon Festival (x3)? Order Moonflower by 2024-01-23 to avoid a stockout."
      }
    ],
    "message": "Full Moon on 2024-01-25 (in 23 days). Announce the Full Moon Festival (x3)? Order Moonflower by 2024-01-23 to avoid a stockout."
  }
]
```

#### `POST /api/reset`
- **Description**: Restores clean baseline data and deletes simulated spikes and test events.
- **Returns**:
```json
{
  "status": "ok",
  "message": "Demo data reset to baseline"
}
```

#### `GET /api/copilot/status`
- **Description**: Returns copilot connectivity status, operational mode, and demo reference date without leaking keys.
- **Returns**:
```json
{
  "llm_available": true,
  "mode": "llm",
  "demo_today": "2024-01-02",
  "model": "gemini-2.5-flash"
}
```

#### `POST /api/copilot/chat`
- **Description**: Conversational copilot engine with function calling, rate limiting, and guardrails.
- **Payload**:
```json
{
  "messages": [
    {"role": "user", "content": "What is the status of my shop?"}
  ]
}
```
- **Returns**:
```json
{
  "reply": "Shop Inventory Status (Demo Date: 2024-01-02, Tuesday)...",
  "mode": "llm",
  "tools_used": [{"name": "get_inventory_status", "args": {}}],
  "pending_action": null,
  "sources": ["ingredients", "alerts"]
}
```
*(When a mutating tool is called, `pending_action` holds `{token, tool, args, summary, expires_in}` and `reply` explains what was proposed).*

#### `POST /api/copilot/confirm`
- **Description**: Single-use confirmation or cancellation of a pending mutating action.
- **Payload**:
```json
{
  "token": "4f5e6a...",
  "approve": true
}
```
- **Returns**:
```json
{
  "status": "confirmed",
  "tool": "simulate_surge",
  "result": { ... },
  "reply": "Demand surge simulated successfully! Ingredients 1, 2, and 3 surged by 3x for 2 days."
}
```

#### `GET /api/copilot/tools/runout`
- **Description**: Forward day-by-day stock depletion evaluation against a target date (YYYY-MM-DD).
- **Query Params**: `date=YYYY-MM-DD`
- **Returns**:
```json
{
  "target_date": "2024-01-05",
  "demo_today": "2024-01-02",
  "assumptions": "Assumes no new replenishment orders are placed and sales follow forecast demand.",
  "ingredients_running_out_count": 0,
  "ingredients": [ ... ],
  "summary": "No ingredients will run out before 2024-01-05."
}
```

#### `GET /api/copilot/tools/delay`
- **Description**: In-memory simulation of supplier delivery delays on lead times, reorder urgency, and stockouts. Pure read-only.
- **Query Params**: `ingredient_id=3&extra_lead_days=3`
- **Returns**:
```json
{
  "extra_lead_days": 3,
  "target": "Wolfsbane",
  "ingredients": [ ... ],
  "summary": "A 3-day delay pushes Wolfsbane's lead time to 6 days..."
}
```


---

## 3. Python Function Signatures (Person A writes, Person B imports)

```python
def forecast_demand(
    history: list[int],
    days_ahead: int,
    event_multiplier: float = 1.0
) -> list[float]:
    """
    Predicts sales for the next `days_ahead` days given historical daily sales.
    Applies `event_multiplier` to the forecasted values.
    """
    ...

def detect_spike(history: list[int]) -> dict:
    """
    Calculates z-score comparing the last 2 days vs baseline (the 14 days before that).
    Returns:
    {
        "is_spike": bool,        # True if z_score > 3.0
        "z_score": float,
        "baseline_avg": float,
        "baseline_std": float,
        "recent_avg": float
    }
    """
    ...

def calculate_reorder(
    daily_forecast: float,
    std: float,
    lead_time_days: int,
    cover_days: int,
    current_stock: int
) -> dict:
    """
    Calculates safety stock, target stock, reorder quantity, days of cover,
    and assigns status ('ok', 'watch', 'critical') and priority ('low', 'medium', 'high').
    Returns:
    {
        "safety_stock": int,
        "target_stock": int,
        "order_qty": int,
        "days_of_cover": float,
        "status": str,
        "priority": str
    }
    """
    ...
```

