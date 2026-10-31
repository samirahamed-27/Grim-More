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
- **Description**: History and forecast for one ingredient, plus spike detection metadata.
- **Returns**:
```json
{
  "ingredient_id": 1,
  "name": "Moonflower",
  "history": [
    {"date": "2026-10-01", "units": 98},
    {"date": "2026-10-02", "units": 103}
  ],
  "forecast": [
    {"date": "2026-11-01", "units": 300.0, "lower": 270.0, "upper": 330.0}
  ],
  "spike": {
    "is_spike": true,
    "z_score": 18.5,
    "baseline_avg": 100.2,
    "baseline_std": 10.1,
    "recent_avg": 287.0
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
  "start_date": "2026-11-08",
  "end_date": "2026-11-14"
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

#### `POST /api/reset`
- **Description**: Restores clean baseline data and deletes simulated spikes and test events.
- **Returns**:
```json
{
  "status": "ok",
  "message": "Demo data reset to baseline"
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

