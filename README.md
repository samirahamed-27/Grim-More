# Potion Pantry 🧙‍♂️✨
> **Track 01 | Inventory prediction for a sudden festival demand spike**  
> 12-Hour Team Battle Plan (HACK-O-LANTERN)

Potion Pantry is a proactive inventory management & spike forecasting system for potion ingredient merchants. It detects demand spikes, predicts future demand, and generates optimal replenishment orders before critical stockouts occur.

---

## Team Division of Work
- **Person A (The Brain)**: Data generation, moving average / exponential smoothing forecasts, and z-score anomaly spike detection (`data/`, `backend/forecast.py`, `backend/spike.py`).
- **Person B (The Engine)**: SQLite database, FastAPI backend API, reorder logic, priority alerts, and scenario simulation (`backend/db.py`, `backend/main.py`, `backend/reorder.py`).
- **Person C (The Face)**: Real-time UI dashboard, Chart.js visualizations, stock cards, alert banners, demo pitch, and slides (`frontend/`).

---

## Project Structure
```
├── backend/          # FastAPI backend, SQLite database, and core business logic
│   ├── main.py       # API endpoints and middleware
│   ├── db.py         # SQLite connection and schema loaders
│   ├── reorder.py    # Reorder formulas, safety stock, days of cover
│   ├── forecast.py   # Forecasting models (Person A)
│   └── spike.py      # Spike detection logic (Person A)
├── frontend/         # Web dashboard
│   ├── index.html    # Single-page UI
│   ├── style.css     # Potion-themed dark UI styles
│   └── app.js        # API fetchers, Chart.js controllers
├── data/             # Historical sales data and synthetic generators
│   └── sales_history.csv
├── docs/             # Canonical project contracts
│   ├── contract.md   # DB schema, API routes, JSON structures, function signatures
│   └── ingredients.md# Official 6-ingredient roster, lead times, and spike targets
├── requirements.txt  # Python dependencies
└── README.md
```

---

## Quickstart

### 1. Backend Setup
```bash
# Create and activate virtual environment (optional but recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the backend API server
uvicorn backend.main:app --reload --port 8000
```
API Documentation (Swagger UI): `http://127.0.0.1:8000/docs`

### 2. Frontend
Open `frontend/index.html` in any modern web browser or serve via:
```bash
python3 -m http.server 3000 --directory frontend
```

---

## Specifications & Contracts
- [API & Schema Contract](docs/contract.md)
- [Product & Ingredients Roster](docs/ingredients.md)

