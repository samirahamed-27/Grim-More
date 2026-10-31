"""
Potion Pantry - SQLite Database Engine (backend/db.py)
Manages potion.db, schema creation, data seeding, and query operations.
Strictly adheres to docs/contract.md table and column definitions.
"""

import os
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, Union
import pandas as pd

# Paths configuration
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "potion.db"
DATA_DIR = BASE_DIR / "data"
INGREDIENTS_CSV = DATA_DIR / "ingredients_seed.csv"
SALES_CSV = DATA_DIR / "sales_history.csv"


def get_connection(db_path: Optional[Union[str, Path]] = None) -> sqlite3.Connection:
    """
    Creates and returns a connection to the SQLite database.
    Enables row factory for dict-like access and enforces foreign keys.
    """
    target_path = Path(db_path) if db_path else DB_PATH
    conn = sqlite3.connect(str(target_path))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db(db_path: Optional[Union[str, Path]] = None) -> None:
    """
    Creates the 4 contract tables in potion.db if they do not exist.
    Seeds ingredients and sales history idempotently from CSV files.
    Calculates initial green buffer stock for each ingredient (Known Issue 1 fix).
    """
    target_path = Path(db_path) if db_path else DB_PATH
    conn = get_connection(target_path)

    with conn:
        cursor = conn.cursor()

        # 1. ingredients table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS ingredients (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                current_stock INTEGER NOT NULL,
                lead_time_days INTEGER NOT NULL,
                cover_days INTEGER NOT NULL
            );
        """)

        # 2. sales table (90+ days of sales history per ingredient)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS sales (
                date TEXT NOT NULL,
                ingredient_id INTEGER NOT NULL,
                units INTEGER NOT NULL,
                PRIMARY KEY (date, ingredient_id),
                FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE
            );
        """)

        # 3. events table (festival announcements)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                ingredient_ids TEXT NOT NULL,
                multiplier REAL NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NOT NULL
            );
        """)

        # 4. reorders table (system generated reorder suggestions)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS reorders (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ingredient_id INTEGER NOT NULL,
                order_qty INTEGER NOT NULL,
                priority TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (ingredient_id) REFERENCES ingredients (id) ON DELETE CASCADE
            );
        """)

        # -------------------------------------------------------------------
        # Seeding ingredients skeleton (first, so sales FKs are satisfied)
        # -------------------------------------------------------------------
        cursor.execute("SELECT COUNT(*) AS cnt FROM ingredients;")
        ing_count = cursor.fetchone()["cnt"]

        if ing_count == 0 and INGREDIENTS_CSV.exists():
            seed_df = pd.read_csv(INGREDIENTS_CSV)
            initial_records = [
                (int(row["id"]), str(row["name"]), int(row.get("current_stock", 0)), int(row["lead_time_days"]), int(row["cover_days"]))
                for _, row in seed_df.iterrows()
            ]
            cursor.executemany(
                """
                INSERT OR IGNORE INTO ingredients (id, name, current_stock, lead_time_days, cover_days)
                VALUES (?, ?, ?, ?, ?);
                """,
                initial_records,
            )

        # -------------------------------------------------------------------
        # Seeding sales history (Idempotent insert with INSERT OR IGNORE)
        # -------------------------------------------------------------------
        cursor.execute("SELECT COUNT(*) AS cnt FROM sales;")
        sales_count = cursor.fetchone()["cnt"]

        if sales_count == 0 and SALES_CSV.exists():
            sales_df = pd.read_csv(SALES_CSV)
            sales_records = [
                (str(row["date"]), int(row["ingredient_id"]), int(row["units"]))
                for _, row in sales_df.iterrows()
            ]
            cursor.executemany(
                "INSERT OR IGNORE INTO sales (date, ingredient_id, units) VALUES (?, ?, ?);",
                sales_records,
            )

        # -------------------------------------------------------------------
        # Apply Known Issue 1 Fix: Set green buffer starting stock
        # -------------------------------------------------------------------
        # Instead of arbitrary static raw numbers, we compute the 14-day mean daily sales.
        # We set current_stock = round(mean_14d * (lead_time + cover_days) * 1.2).
        # This guarantees that at baseline, days_of_cover = (lead_time + cover_days) * 1.2,
        # which is strictly >= lead_time + 2, ensuring all ingredients start with status 'ok' (green).
        cursor.execute("SELECT id, lead_time_days, cover_days FROM ingredients;")
        all_ings = cursor.fetchall()
        for ing in all_ings:
            ing_id = ing["id"]
            lead_time = ing["lead_time_days"]
            cover_days = ing["cover_days"]

            cursor.execute(
                """
                SELECT AVG(units) as avg_units
                FROM (
                    SELECT units
                    FROM sales
                    WHERE ingredient_id = ?
                    ORDER BY date DESC
                    LIMIT 14
                );
                """,
                (ing_id,),
            )
            res = cursor.fetchone()
            avg_14d = res["avg_units"] if (res and res["avg_units"] is not None) else 100.0
            green_stock = int(round(avg_14d * (lead_time + cover_days) * 1.2))

            cursor.execute(
                "UPDATE ingredients SET current_stock = ? WHERE id = ?;",
                (green_stock, ing_id),
            )

    conn.close()


def get_ingredients(db_path: Optional[Union[str, Path]] = None) -> List[Dict[str, Any]]:
    """
    Fetches all ingredients from the ingredients table ordered by ID.
    Returns list of dictionaries containing id, name, stock, lead time, and cover days.
    """
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT id, name, current_stock, lead_time_days, cover_days FROM ingredients ORDER BY id ASC;"
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def get_recent_sales(
    ingredient_id: int, days: int = 14, db_path: Optional[Union[str, Path]] = None
) -> List[Dict[str, Any]]:
    """
    Fetches the most recent daily sales records for a specific ingredient.
    Returns list of dicts with date, ingredient_id, and units sorted chronologically.
    """
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT date, ingredient_id, units
            FROM sales
            WHERE ingredient_id = ?
            ORDER BY date DESC
            LIMIT ?;
            """,
            (ingredient_id, days),
        )
        # Reverse to return in chronological order (oldest to newest)
        rows = cursor.fetchall()
        return [dict(row) for row in reversed(rows)]
    finally:
        conn.close()


def insert_event(
    name: str,
    ingredient_ids: Union[List[int], str],
    multiplier: float,
    start_date: str,
    end_date: str,
    db_path: Optional[Union[str, Path]] = None,
) -> int:
    """
    Inserts a new demand event/festival announcement into the events table.
    Stores ingredient IDs as a comma-separated string for SQLite compatibility.
    Returns the auto-generated primary key ID of the inserted event.
    """
    if isinstance(ingredient_ids, list):
        ids_str = ",".join(str(i) for i in ingredient_ids)
    else:
        ids_str = str(ingredient_ids)

    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO events (name, ingredient_ids, multiplier, start_date, end_date)
                VALUES (?, ?, ?, ?, ?);
                """,
                (name, ids_str, float(multiplier), start_date, end_date),
            )
            return cursor.lastrowid
    finally:
        conn.close()


def get_active_events(db_path: Optional[Union[str, Path]] = None) -> List[Dict[str, Any]]:
    """
    Retrieves all festival and demand surge events currently recorded in events table.
    Converts comma-separated ingredient_ids string back into list of integer IDs.
    Returns list of structured event dictionaries.
    """
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT id, name, ingredient_ids, multiplier, start_date, end_date FROM events ORDER BY id ASC;")
        events = []
        for row in cursor.fetchall():
            row_dict = dict(row)
            ids_str = row_dict["ingredient_ids"]
            row_dict["ingredient_ids"] = [int(i.strip()) for i in ids_str.split(",") if i.strip()]
            events.append(row_dict)
        return events
    finally:
        conn.close()


def record_reorder(
    ingredient_id: int,
    order_qty: int,
    priority: str,
    db_path: Optional[Union[str, Path]] = None,
) -> int:
    """
    Persists a generated reorder recommendation into the reorders audit table.
    Captures ingredient ID, recommended order quantity, priority level, and timestamp.
    Returns the auto-generated reorder record ID.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    conn = get_connection(db_path)
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(
                """
                INSERT INTO reorders (ingredient_id, order_qty, priority, created_at)
                VALUES (?, ?, ?, ?);
                """,
                (ingredient_id, order_qty, priority.lower(), now_iso),
            )
            return cursor.lastrowid
    finally:
        conn.close()


def get_latest_reorder(
    ingredient_id: int, db_path: Optional[Union[str, Path]] = None
) -> Optional[Dict[str, Any]]:
    """
    Fetches the most recent reorder recommendation recorded for an ingredient.
    Used for audit deduplication to prevent redundant database writes.
    """
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT id, ingredient_id, order_qty, priority, created_at
            FROM reorders
            WHERE ingredient_id = ?
            ORDER BY id DESC
            LIMIT 1;
            """,
            (ingredient_id,),
        )
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()


def get_reorders(db_path: Optional[Union[str, Path]] = None) -> List[Dict[str, Any]]:
    """
    Retrieves stored reorder recommendations sorted with highest urgency first.
    Joins with ingredients table to include ingredient names and stock info.
    Returns list of prioritized reorder suggestions.
    """
    conn = get_connection(db_path)
    try:
        cursor = conn.cursor()
        cursor.execute(
            """
            SELECT 
                r.id,
                r.ingredient_id,
                i.name AS ingredient_name,
                i.current_stock,
                r.order_qty,
                r.priority,
                r.created_at
            FROM reorders r
            JOIN ingredients i ON r.ingredient_id = i.id
            ORDER BY 
                CASE r.priority 
                    WHEN 'high' THEN 1 
                    WHEN 'medium' THEN 2 
                    WHEN 'low' THEN 3 
                    ELSE 4 
                END ASC,
                r.id DESC;
            """
        )
        return [dict(row) for row in cursor.fetchall()]
    finally:
        conn.close()


def reset_state(db_path: Optional[Union[str, Path]] = None) -> None:
    """
    Clears all active events and reorder records to restore baseline demo state.
    Recalculates and resets each ingredient's current_stock to baseline green stock.
    Guarantees clean, reproducible state for demo resets.
    """
    target_path = Path(db_path) if db_path else DB_PATH
    conn = get_connection(target_path)
    with conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM events;")
        cursor.execute("DELETE FROM reorders;")

        # Restore baseline green stock for each ingredient
        if INGREDIENTS_CSV.exists():
            seed_df = pd.read_csv(INGREDIENTS_CSV)
            for _, row in seed_df.iterrows():
                ing_id = int(row["id"])
                lead_time = int(row["lead_time_days"])
                cover_days = int(row["cover_days"])

                cursor.execute(
                    """
                    SELECT AVG(units) as avg_units
                    FROM (
                        SELECT units
                        FROM sales
                        WHERE ingredient_id = ?
                        ORDER BY date DESC
                        LIMIT 14
                    );
                    """,
                    (ing_id,),
                )
                res = cursor.fetchone()
                avg_14d = res["avg_units"] if (res and res["avg_units"] is not None) else 100.0
                green_stock = int(round(avg_14d * (lead_time + cover_days) * 1.2))

                cursor.execute(
                    "UPDATE ingredients SET current_stock = ? WHERE id = ?;",
                    (green_stock, ing_id),
                )
    conn.close()


if __name__ == "__main__":
    print(f"Initializing Potion Pantry database at {DB_PATH}...")
    init_db()
    ingredients = get_ingredients()
    print(f"Initialized database successfully with {len(ingredients)} ingredients:")
    for ing in ingredients:
        print(f"  [{ing['id']}] {ing['name']}: Stock={ing['current_stock']}, Lead={ing['lead_time_days']}d, CoverTarget={ing['cover_days']}d")
