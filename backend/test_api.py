"""
Integration tests for Potion Pantry Live API (backend/test_api.py).
Tests real database flows, spike simulation, festival announcements, and reset state.
"""

import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.db import init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def ensure_db_clean():
    """Guarantees a clean, initialized database baseline before each test."""
    init_db()
    client.post("/api/reset")
    yield
    client.post("/api/reset")


def test_normal_data_gives_no_spike_for_all_ingredients():
    """
    Test 1: Under normal baseline data, no ingredient should be flagged as a spike,
    and all 6 ingredients should have status 'ok' and order_qty 0.
    """
    resp = client.get("/api/ingredients")
    assert resp.status_code == 200
    ingredients = resp.json()
    assert len(ingredients) == 6

    for ing in ingredients:
        # Check forecast endpoint spike metadata
        fc_resp = client.get(f"/api/forecast/{ing['id']}")
        assert fc_resp.status_code == 200
        fc_data = fc_resp.json()

        spike = fc_data["spike"]
        assert spike["is_spike"] is False, f"Ingredient {ing['name']} unexpectedly spiked under normal data!"
        assert spike["z_score"] < 3.0

        # At baseline, all ingredients must be green with 0 order quantity
        assert ing["status"] == "ok"
        assert ing["order_qty"] == 0
        assert ing["priority"] == "low"


def test_simulate_spike_affects_only_ids_1_to_3():
    """
    Test 2: After calling POST /api/simulate-spike, ingredients 1, 2, and 3 must be flagged
    as spikes with high z-scores, while ingredients 4, 5, and 6 remain non-spiked.
    """
    spike_resp = client.post("/api/simulate-spike")
    assert spike_resp.status_code == 200
    spike_data = spike_resp.json()
    assert spike_data["affected_ingredients"] == [1, 2, 3]

    # Verify each ingredient's spike status via forecast endpoint
    for ing_id in [1, 2, 3]:
        fc_resp = client.get(f"/api/forecast/{ing_id}")
        assert fc_resp.status_code == 200
        spike_info = fc_resp.json()["spike"]
        assert spike_info["is_spike"] is True, f"Ingredient {ing_id} should be flagged as spike!"
        assert spike_info["z_score"] > 3.0

    for ing_id in [4, 5, 6]:
        fc_resp = client.get(f"/api/forecast/{ing_id}")
        assert fc_resp.status_code == 200
        spike_info = fc_resp.json()["spike"]
        assert spike_info["is_spike"] is False, f"Ingredient {ing_id} should NOT be flagged as spike!"
        assert spike_info["z_score"] < 3.0

    # Verify reorders are generated for the spiked ingredients
    reorders_resp = client.get("/api/reorders")
    assert reorders_resp.status_code == 200
    reorders = reorders_resp.json()
    assert len(reorders) == 6

    # Most urgent items must be critical with large replenishment quantities
    assert reorders[0]["status"] == "critical"
    assert reorders[0]["order_qty"] > 0


def test_reset_restores_all_ingredients_to_green():
    """
    Test 3: After triggering a spike, calling POST /api/reset must clean up the
    injected spike sales rows and reset all 6 ingredients back to status 'ok' with order_qty 0.
    """
    # 1. Trigger spike first
    client.post("/api/simulate-spike")

    # 2. Reset shop to baseline
    reset_resp = client.post("/api/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["status"] == "ok"

    # 3. Verify all ingredients are green with order_qty 0
    resp = client.get("/api/ingredients")
    assert resp.status_code == 200
    ingredients = resp.json()
    assert len(ingredients) == 6

    for ing in ingredients:
        assert ing["status"] == "ok", f"Ingredient {ing['name']} is not green after reset: {ing['status']}"
        assert ing["order_qty"] == 0, f"Ingredient {ing['name']} order_qty is not 0 after reset: {ing['order_qty']}"
        assert ing["priority"] == "low"

        # Spike flag must be cleared
        fc_data = client.get(f"/api/forecast/{ing['id']}").json()
        assert fc_data["spike"]["is_spike"] is False


def test_post_event_raises_forecast_multiplier():
    """
    Test 4: POST /api/event records festival announcement and raises daily forecast
    for the specified ingredient IDs by the multiplier.
    """
    # Baseline forecast before event
    base_moonflower = next(i for i in client.get("/api/ingredients").json() if i["id"] == 1)
    base_forecast = base_moonflower["daily_forecast"]

    # Announce festival starting today with 3.0x multiplier on Moonflower (ID 1)
    event_payload = {
        "name": "Full Moon Festival",
        "ingredient_ids": [1],
        "multiplier": 3.0,
        "start_date": "2024-01-02",
        "end_date": "2024-01-14",
    }
    event_resp = client.post("/api/event", json=event_payload)
    assert event_resp.status_code == 200
    data = event_resp.json()
    assert "recorded successfully" in data["message"]

    # Verify forecast scaled by approximately 3.0x
    updated_moonflower = next(i for i in client.get("/api/ingredients").json() if i["id"] == 1)
    assert updated_moonflower["daily_forecast"] > base_forecast * 2.5
