import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.db import init_db

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    init_db()
    yield
    client.post("/api/reset")

def test_root_and_health():
    resp = client.get("/")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ready"

    health = client.get("/health")
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

def test_get_ingredients_normal_and_spike():
    # 1. Reset first
    reset_resp = client.post("/api/reset")
    assert reset_resp.status_code == 200

    # 2. Check baseline ingredients
    resp = client.get("/api/ingredients")
    assert resp.status_code == 200
    ingredients = resp.json()
    assert len(ingredients) == 6
    moonflower = next(item for item in ingredients if item["id"] == 1)
    assert moonflower["name"] == "Moonflower"
    assert moonflower["daily_forecast"] > 0
    assert moonflower["status"] == "ok"

    # 3. Simulate spike
    spike_resp = client.post("/api/simulate-spike")
    assert spike_resp.status_code == 200
    spike_data = spike_resp.json()
    assert 1 in spike_data["affected_ingredients"]

    # 4. Check ingredients during spike
    resp2 = client.get("/api/ingredients")
    assert resp2.status_code == 200
    spiked_ingredients = resp2.json()
    moonflower_spiked = next(item for item in spiked_ingredients if item["id"] == 1)
    assert moonflower_spiked["daily_forecast"] > moonflower["daily_forecast"] * 2.5
    assert moonflower_spiked["status"] == "critical"
    assert moonflower_spiked["order_qty"] > 0

def test_get_forecast():
    client.post("/api/reset")
    resp = client.get("/api/forecast/1")
    assert resp.status_code == 200
    data = resp.json()
    assert data["ingredient_id"] == 1
    assert "history" in data
    assert "forecast" in data
    assert "spike" in data
    assert len(data["history"]) == 30
    assert len(data["forecast"]) == 7

def test_get_reorders():
    client.post("/api/simulate-spike")
    resp = client.get("/api/reorders")
    assert resp.status_code == 200
    reorders = resp.json()
    assert len(reorders) >= 3
    # Most urgent should be critical (Moonflower or Wolfsbane)
    assert reorders[0]["status"] == "critical"
    assert reorders[0]["priority"] == "high"

def test_announce_event():
    payload = {
        "name": "Full Moon Festival",
        "ingredient_ids": [1, 2, 3],
        "multiplier": 3.0,
        "start_date": "2024-01-08",
        "end_date": "2024-01-14"
    }
    resp = client.post("/api/event", json=payload)
    assert resp.status_code == 200
    assert "recorded successfully" in resp.json()["message"]
