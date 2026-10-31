"""
Tests for Restock Feature (tests/test_restock.py)
Validates ingredient search, purchase restock transactions, input bounds, and error envelopes.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.db import init_db, get_connection

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database schema exists and reset baseline before each test."""
    init_db()
    client.post("/api/reset")
    yield
    client.post("/api/reset")


def test_valid_restock():
    """
    Test 1: Valid restock.
    Expected: Status 200, current_stock increases by quantity, purchase inserted in DB.
    """
    # 1. Fetch current stock
    ing_resp = client.get("/api/ingredients")
    assert ing_resp.status_code == 200
    moonflower = next(item for item in ing_resp.json() if item["id"] == 1)
    initial_stock = moonflower["current_stock"]

    # 2. Restock 50 units
    payload = {"ingredient_id": 1, "quantity": 50}
    resp = client.post("/api/purchases", json=payload)
    assert resp.status_code == 200

    data = resp.json()
    assert data["id"] == 1
    assert data["name"] == "Moonflower"
    assert data["current_stock"] == initial_stock + 50

    # 3. Verify database purchase record
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT ingredient_id, quantity FROM purchases WHERE ingredient_id = 1 ORDER BY id DESC LIMIT 1;")
    row = cursor.fetchone()
    conn.close()
    assert row is not None
    assert row["ingredient_id"] == 1
    assert row["quantity"] == 50


def test_restock_quantity_zero():
    """
    Test 2: Quantity 0 is rejected by validation.
    Expected: Status 422 with {"error": "..."} format.
    """
    payload = {"ingredient_id": 1, "quantity": 0}
    resp = client.post("/api/purchases", json=payload)
    assert resp.status_code == 422
    assert "error" in resp.json()


def test_restock_negative_quantity():
    """
    Test 3: Negative quantity is rejected by validation.
    Expected: Status 422 with {"error": "..."} format.
    """
    payload = {"ingredient_id": 1, "quantity": -5}
    resp = client.post("/api/purchases", json=payload)
    assert resp.status_code == 422
    assert "error" in resp.json()


def test_restock_huge_quantity():
    """
    Test 4: Quantity exceeding MAX_QUANTITY (100,000) is rejected.
    Expected: Status 422 with {"error": "..."} format.
    """
    payload = {"ingredient_id": 1, "quantity": 100_001}
    resp = client.post("/api/purchases", json=payload)
    assert resp.status_code == 422
    assert "error" in resp.json()


def test_restock_unknown_ingredient_id():
    """
    Test 5: Unknown ingredient ID returns not found.
    Expected: Status 404 with {"error": "Ingredient not found."}.
    """
    payload = {"ingredient_id": 99999, "quantity": 10}
    resp = client.post("/api/purchases", json=payload)
    assert resp.status_code == 404
    assert resp.json() == {"error": "Ingredient not found."}


def test_search_containing_percent():
    """
    Test 6: Search query with '%' wildcard character is escaped.
    Expected: Status 200, returns empty list because no ingredient contains literal '%'.
    """
    resp = client.get("/api/ingredients/search?q=%")
    assert resp.status_code == 200
    assert resp.json() == []

    # Verify regular partial search works as expected
    resp_valid = client.get("/api/ingredients/search?q=Moon")
    assert resp_valid.status_code == 200
    results = resp_valid.json()
    assert len(results) >= 1
    assert any(item["name"] == "Moonflower" for item in results)

