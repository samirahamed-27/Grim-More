"""
Unit and Integration Tests for AI Invoice & E-Bill Scanner (tests/test_invoice.py)
Tests fuzzy matching, Gemini multimodal scanner, fallback parser, and atomic inventory confirmation.
"""

import io
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

from backend.main import app
from backend.db import get_connection, init_db
from backend.invoice_parser import fuzzy_match_ingredient, scan_invoice_fallback

client = TestClient(app)


@pytest.fixture(autouse=True)
def setup_db():
    """Ensure database is initialized before each test."""
    init_db()


def test_fuzzy_matching_aliases():
    """Verify alias mapping for all 6 canonical ingredients."""
    test_cases = [
        ("P0016 Floral Extract Moonflower", 1, "Moonflower"),
        ("Moonflower dried petals x 500", 1, "Moonflower"),
        ("P0020 Distilled Silver Dew Vial", 2, "Silver Dew"),
        ("Pure distilled dew 300ml", 2, "Silver Dew"),
        ("P0014 Aconite monkshood herb", 3, "Wolfsbane"),
        ("Aconitum / Wolfsbane extract", 3, "Wolfsbane"),
        ("P0005 Amber Resin grade A", 4, "Dragon Resin"),
        ("Dragon's blood resin 100g", 4, "Dragon Resin"),
        ("P0008 Atropa belladonna leaves", 5, "Nightshade"),
        ("Deadly Nightshade pure powder", 5, "Nightshade"),
        ("P0002 Mandragora screaming root", 6, "Mandrake Root"),
        ("Mandrake dried roots x 80", 6, "Mandrake Root"),
    ]

    for raw, expected_id, expected_name in test_cases:
        match = fuzzy_match_ingredient(raw)
        assert match is not None, f"Failed to match: {raw}"
        ing_id, canonical, conf = match
        assert ing_id == expected_id
        assert canonical == expected_name
        assert conf >= 0.70


def test_invoice_scan_unsupported_file_extension():
    """Ensure unsupported file types are rejected with 422."""
    fake_file = io.BytesIO(b"executable content")
    response = client.post(
        "/api/invoice/scan",
        files={"file": ("malicious.exe", fake_file, "application/octet-stream")},
    )
    assert response.status_code == 422
    assert "error" in response.json()


def test_invoice_scan_empty_file():
    """Ensure empty files are rejected with 422."""
    empty_file = io.BytesIO(b"")
    response = client.post(
        "/api/invoice/scan",
        files={"file": ("empty.png", empty_file, "image/png")},
    )
    assert response.status_code == 422
    assert "empty" in response.json().get("error", "").lower()


def test_invoice_scan_oversized_file():
    """Ensure files exceeding 10MB are rejected with 413."""
    oversized = io.BytesIO(b"0" * (10 * 1024 * 1024 + 10))
    response = client.post(
        "/api/invoice/scan",
        files={"file": ("huge.pdf", oversized, "application/pdf")},
    )
    assert response.status_code == 413
    assert "exceeds" in response.json().get("error", "").lower()


def test_invoice_scan_fallback_with_sample_receipt():
    """Verify scanner extracts line items with fallback parser."""
    fake_image_bytes = b"RECEIPT #INV-9021\nMoonflower petals x 450\nWolfsbane aconite x 200\n"
    response = client.post(
        "/api/invoice/scan",
        files={"file": ("receipt.png", io.BytesIO(fake_image_bytes), "image/png")},
    )
    assert response.status_code == 200
    data = response.json()
    assert "invoice_number" in data
    assert "items" in data
    assert len(data["items"]) >= 1

    # Check that Moonflower is detected
    item_names = [it["ingredient_name"] for it in data["items"]]
    assert "Moonflower" in item_names


def test_invoice_scan_gemini_multimodal_mock():
    """Verify Gemini Vision parser properly converts LLM JSON to structured response."""
    mock_llm_json = {
        "invoice_number": "INV-GEMINI-2026",
        "supplier": "Starlight Herbal Supplies",
        "date": "2026-11-01",
        "detected_items": [
            {
                "raw_text": "P0016 Moonflower dried petals x 600",
                "quantity": 600,
                "candidate_name": "Moonflower",
            },
            {
                "raw_text": "P0005 Amber Resin grade A x 250",
                "quantity": 250,
                "candidate_name": "Dragon Resin",
            },
        ],
        "unmatched_items": [],
    }

    mock_resp = MagicMock()
    mock_resp.text = json.dumps(mock_llm_json)

    with patch("os.getenv", return_value="fake-gemini-key"):
        with patch("google.genai.Client") as mock_client_cls:
            mock_client = MagicMock()
            mock_client_cls.return_value = mock_client
            mock_client.models.generate_content.return_value = mock_resp

            fake_bytes = io.BytesIO(b"\x89PNG\r\n\x1a\nfakeimagebytes")
            response = client.post(
                "/api/invoice/scan",
                files={"file": ("supplier_invoice.png", fake_bytes, "image/png")},
            )
            assert response.status_code == 200
            data = response.json()
            assert data["invoice_number"] == "INV-GEMINI-2026"
            assert data["supplier"] == "Starlight Herbal Supplies"
            assert len(data["items"]) == 2
            assert data["items"][0]["ingredient_id"] == 1
            assert data["items"][0]["quantity"] == 600
            assert data["items"][1]["ingredient_id"] == 4
            assert data["items"][1]["quantity"] == 250


def test_invoice_confirm_atomically_updates_inventory():
    """Verify confirming scanned items increments stock in SQLite atomically."""
    conn = get_connection()
    with conn:
        cursor = conn.cursor()
        cursor.execute("SELECT current_stock FROM ingredients WHERE id = 1;")
        initial_stock = cursor.fetchone()[0]

    payload = {
        "items": [
            {"ingredient_id": 1, "quantity": 350},
            {"ingredient_id": 2, "quantity": 120},
        ],
        "invoice_reference": "INV-TEST-CONFIRM-01",
    }

    response = client.post("/api/invoice/confirm", json=payload)
    assert response.status_code == 200
    res_data = response.json()
    assert "Successfully replenished" in res_data["message"]
    assert res_data["invoice_reference"] == "INV-TEST-CONFIRM-01"

    # Verify database updated
    with conn:
        cursor = conn.cursor()
        cursor.execute("SELECT current_stock FROM ingredients WHERE id = 1;")
        new_stock = cursor.fetchone()[0]
        assert new_stock == initial_stock + 350

        # Verify purchase transaction row recorded
        cursor.execute(
            "SELECT quantity FROM purchases WHERE ingredient_id = 1 ORDER BY id DESC LIMIT 1;"
        )
        assert cursor.fetchone()[0] == 350


def test_invoice_confirm_invalid_payload():
    """Ensure invalid inputs like empty item list or negative quantities are rejected."""
    # Empty items
    res1 = client.post("/api/invoice/confirm", json={"items": [], "invoice_reference": "REF"})
    assert res1.status_code == 422

    # Negative quantity
    res2 = client.post(
        "/api/invoice/confirm",
        json={"items": [{"ingredient_id": 1, "quantity": -50}], "invoice_reference": "REF"},
    )
    assert res2.status_code == 422
