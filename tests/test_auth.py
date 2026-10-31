"""
Unit & Integration Tests for Google Authentication (tests/test_auth.py)
Tests GIS token verification, session lifecycle, and route protection.
"""

import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient

from backend.main import app
from backend.auth import create_session_token, verify_session_token

client = TestClient(app)


def test_auth_config_endpoint():
    """Verify that the frontend can dynamically fetch auth configuration."""
    response = client.get("/api/auth/config")
    assert response.status_code == 200
    data = response.json()
    assert "google_client_id" in data


def test_google_login_success():
    """Verify successful login creates a valid session and returns user profile."""
    mock_id_info = {
        "sub": "google-user-12345",
        "email": "alchemist@potionpantry.io",
        "name": "Master Alchemist",
        "picture": "https://example.com/avatar.png",
        "iss": "https://accounts.google.com",
        "email_verified": True,
    }

    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=mock_id_info):
        response = client.post(
            "/api/auth/google",
            json={"credential": "valid.mocked.google.id.token.xyz"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "session_token" in data
        assert data["user"]["email"] == "alchemist@potionpantry.io"
        assert data["user"]["name"] == "Master Alchemist"
        assert data["user"]["email_verified"] is True
        # Check cookie was set
        assert "session_token" in response.cookies


def test_google_login_unverified_email_rejected():
    """Ensure that accounts with unverified emails are strictly rejected with 401."""
    mock_id_info = {
        "sub": "unverified-user",
        "email": "intruder@potionpantry.io",
        "iss": "https://accounts.google.com",
        "email_verified": False,
    }

    with patch("google.oauth2.id_token.verify_oauth2_token", return_value=mock_id_info):
        response = client.post(
            "/api/auth/google",
            json={"credential": "unverified.mocked.token"},
        )
        assert response.status_code == 401
        assert "verified" in response.json().get("error", "").lower()


def test_google_login_invalid_token_rejected():
    """Ensure that corrupted or expired tokens return 401 Unauthorized."""
    with patch("google.oauth2.id_token.verify_oauth2_token", side_effect=ValueError("Token expired")):
        response = client.post(
            "/api/auth/google",
            json={"credential": "expired.invalid.token"},
        )
        assert response.status_code == 401
        assert "error" in response.json()


def test_auth_me_protected_endpoint():
    """Verify that /api/auth/me rejects unauthenticated requests and accepts valid sessions."""
    # Ensure client has no leftover session cookies from previous tests
    client.cookies.clear()

    # 1. Unauthenticated request -> 401
    unauth_resp = client.get("/api/auth/me")
    assert unauth_resp.status_code == 401

    # 2. Authenticated with valid session token
    valid_user = {
        "sub": "user-888",
        "email": "sorcerer@potionpantry.io",
        "name": "Grand Sorcerer",
        "picture": "https://example.com/sorcerer.png",
    }
    session_token = create_session_token(valid_user)

    auth_resp = client.get(
        "/api/auth/me",
        headers={"Authorization": f"Bearer {session_token}"},
    )
    assert auth_resp.status_code == 200
    profile = auth_resp.json()
    assert profile["email"] == "sorcerer@potionpantry.io"
    assert profile["name"] == "Grand Sorcerer"


def test_logout_endpoint():
    """Verify that logout clears the cookie."""
    response = client.post("/api/auth/logout")
    assert response.status_code == 200
    assert "session_token" in response.headers.get("set-cookie", "")


def test_email_login_success():
    """Verify direct email login returns valid session and user profile."""
    client.cookies.clear()
    response = client.post(
        "/api/auth/email",
        json={"email": "sorceress.circe@potionpantry.io", "name": "Circe the Sorceress"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "session_token" in data
    assert data["user"]["email"] == "sorceress.circe@potionpantry.io"
    assert data["user"]["name"] == "Circe the Sorceress"
    assert data["user"]["email_verified"] is True
    assert "session_token" in response.cookies


def test_email_login_invalid_email_rejected():
    """Ensure malformed emails are rejected with 422 Unprocessable Entity."""
    client.cookies.clear()
    response = client.post(
        "/api/auth/email",
        json={"email": "not-an-email"},
    )
    assert response.status_code == 422
    assert "error" in response.json()

