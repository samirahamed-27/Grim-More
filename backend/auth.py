"""
Potion Pantry - Authentication & Session Management (backend/auth.py)
Handles Google Identity Services token verification, HMAC session signing,
and FastAPI auth dependency protection.
"""

from __future__ import annotations

import base64
import hmac
import hashlib
import json
import os
import time
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from fastapi import Header, HTTPException, Request, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token

# Load environment variables from .env if present
_ENV_PATH = Path(__file__).resolve().parent.parent / ".env"
if _ENV_PATH.exists():
    load_dotenv(dotenv_path=_ENV_PATH)

# Google OAuth Client ID (must match the client ID generated in Google Cloud Console)
GOOGLE_CLIENT_ID: str = os.getenv(
    "GOOGLE_CLIENT_ID",
    "985847650621-a83dhfihhfijl3j1bl0ssmu5k10srthb.apps.googleusercontent.com",
)

# Secret key used for signing session tokens
SESSION_SECRET: str = os.getenv("SESSION_SECRET", "potion-pantry-spooky-secure-secret-2026")

# Session validity duration in seconds (7 days default)
SESSION_EXPIRY_SECONDS: int = 7 * 24 * 3600


def get_google_client_id() -> str:
    """Returns the configured Google Client ID."""
    return os.getenv("GOOGLE_CLIENT_ID", GOOGLE_CLIENT_ID)


def verify_google_id_token(credential: str) -> Dict[str, Any]:
    """
    Verifies a Google ID token (JWT) using google-auth.
    Validates audience against GOOGLE_CLIENT_ID and requires email_verified == True.
    Raises HTTPException(401) on failure.
    """
    client_id = get_google_client_id()
    if not credential or not isinstance(credential, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Google ID token credential is required.",
        )

    try:
        # If client_id is set, verify against it; otherwise verify signature without audience check
        target_audience = client_id if client_id else None
        id_info = id_token.verify_oauth2_token(
            credential,
            google_requests.Request(),
            target_audience,
        )

        # Validate issuer
        issuer = id_info.get("iss", "")
        if issuer not in ["accounts.google.com", "https://accounts.google.com"]:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid Google token issuer.",
            )

        # Ensure email is verified by Google
        if not id_info.get("email_verified", False):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google account email is not verified.",
            )

        return {
            "sub": id_info.get("sub"),
            "email": id_info.get("email"),
            "name": id_info.get("name", id_info.get("email", "")),
            "picture": id_info.get("picture", ""),
            "email_verified": True,
        }

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid or expired Google token: {str(exc)}",
        ) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed while verifying Google token.",
        ) from exc


def _b64_url_encode(data: bytes) -> str:
    """Helper to encode bytes into URL-safe base64 without padding."""
    return base64.urlsafe_b64encode(data).decode("utf-8").rstrip("=")


def _b64_url_decode(data: str) -> bytes:
    """Helper to decode URL-safe base64 with missing padding handled."""
    padding = 4 - (len(data) % 4)
    if padding != 4:
        data += "=" * padding
    return base64.urlsafe_b64decode(data.encode("utf-8"))


def create_session_token(user_data: Dict[str, Any], expires_in: int = SESSION_EXPIRY_SECONDS) -> str:
    """
    Creates a signed HMAC-SHA256 session token containing user details and expiration time.
    Format: <base64_payload>.<hex_signature>
    """
    payload = {
        "sub": user_data.get("sub"),
        "email": user_data.get("email"),
        "name": user_data.get("name"),
        "picture": user_data.get("picture"),
        "exp": int(time.time()) + expires_in,
    }
    payload_bytes = json.dumps(payload, separators=(",", ":")).encode("utf-8")
    payload_b64 = _b64_url_encode(payload_bytes)

    secret_bytes = SESSION_SECRET.encode("utf-8")
    signature = hmac.new(secret_bytes, payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()

    return f"{payload_b64}.{signature}"


def verify_session_token(token: str) -> Dict[str, Any]:
    """
    Decodes and validates a session token.
    Raises HTTPException(401) if invalid, tampered with, or expired.
    """
    if not token or "." not in token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token format.",
        )

    parts = token.split(".", 1)
    if len(parts) != 2:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Malformed session token.",
        )

    payload_b64, signature = parts

    secret_bytes = SESSION_SECRET.encode("utf-8")
    expected_sig = hmac.new(secret_bytes, payload_b64.encode("utf-8"), hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token signature mismatch.",
        )

    try:
        payload_bytes = _b64_url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode("utf-8"))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Unable to decode session token payload.",
        ) from exc

    # Check expiration
    exp = payload.get("exp", 0)
    if time.time() > exp:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please sign in again.",
        )

    return payload


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
) -> Dict[str, Any]:
    """
    FastAPI dependency that extracts and validates the user session.
    Reads token from 'Authorization: Bearer <token>' header or 'session_token' cookie.
    Raises HTTPException(401) if not authenticated.
    """
    token: Optional[str] = None

    if authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer ") :].strip()
    elif "session_token" in request.cookies:
        token = request.cookies.get("session_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in with Google.",
        )

    return verify_session_token(token)


async def get_optional_current_user(
    request: Request,
    authorization: Optional[str] = Header(None),
) -> Optional[Dict[str, Any]]:
    """
    FastAPI dependency for endpoints that can be accessed by both authenticated and anonymous users.
    Returns user dict if valid session is present, otherwise None without raising an error.
    """
    try:
        return await get_current_user(request=request, authorization=authorization)
    except HTTPException:
        return None

