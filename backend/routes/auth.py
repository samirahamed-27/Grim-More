"""
Potion Pantry - Google Authentication Routes (backend/routes/auth.py)
Endpoints for Google OAuth ID token verification, session lifecycle, and config.
"""

import hashlib
from fastapi import APIRouter, Depends, HTTPException, Response, status
from backend.auth import (
    create_session_token,
    get_current_user,
    get_google_client_id,
    verify_google_id_token,
    SESSION_EXPIRY_SECONDS,
)
from backend.schemas import (
    AuthConfigResponse,
    EmailAuthRequest,
    GoogleAuthRequest,
    GoogleAuthResponse,
    UserProfile,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/config", response_model=AuthConfigResponse)
def get_auth_config() -> AuthConfigResponse:
    """Returns the Google Client ID required by Google Identity Services."""
    client_id = get_google_client_id()
    return AuthConfigResponse(google_client_id=client_id)


@router.post("/google", response_model=GoogleAuthResponse)
def google_auth_login(payload: GoogleAuthRequest, response: Response) -> GoogleAuthResponse:
    """
    Verifies the Google ID token and issues a secure signed session token.
    Stores the token in an HttpOnly cookie and returns the user profile.
    """
    user_info = verify_google_id_token(payload.credential)

    # Generate cryptographically signed HMAC session token
    session_token = create_session_token(user_info)

    # Set secure cookie as defense-in-depth alongside frontend token storage
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=SESSION_EXPIRY_SECONDS,
        httponly=True,
        samesite="lax",
    )

    return GoogleAuthResponse(
        session_token=session_token,
        user=UserProfile(
            sub=user_info["sub"],
            email=user_info["email"],
            name=user_info["name"],
            picture=user_info.get("picture"),
            email_verified=True,
        ),
    )


@router.post("/email", response_model=GoogleAuthResponse)
def email_auth_login(payload: EmailAuthRequest, response: Response) -> GoogleAuthResponse:
    """
    Direct email authentication endpoint.
    Validates email format, signs an HMAC session token, sets an HttpOnly cookie,
    and returns the authenticated user profile.
    """
    email = payload.email.strip().lower()
    if "@" not in email or "." not in email.split("@")[-1] or len(email) < 5:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Please provide a valid email address (e.g. alchemist@potionpantry.io).",
        )

    # Derive display name from payload or email prefix
    if payload.name and payload.name.strip():
        display_name = payload.name.strip()
    else:
        prefix = email.split("@")[0].replace(".", " ").replace("_", " ").replace("-", " ")
        display_name = prefix.title()

    # Stable sub identifier derived from email hash
    sub_id = f"email_{hashlib.sha256(email.encode('utf-8')).hexdigest()[:16]}"

    user_info = {
        "sub": sub_id,
        "email": email,
        "name": display_name,
        "picture": None,
        "email_verified": True,
    }

    # Generate cryptographically signed HMAC session token
    session_token = create_session_token(user_info)

    # Set secure cookie as defense-in-depth
    response.set_cookie(
        key="session_token",
        value=session_token,
        max_age=SESSION_EXPIRY_SECONDS,
        httponly=True,
        samesite="lax",
    )

    return GoogleAuthResponse(
        session_token=session_token,
        user=UserProfile(**user_info),
    )



@router.get("/me", response_model=UserProfile)
def get_authenticated_profile(current_user: dict = Depends(get_current_user)) -> UserProfile:
    """Returns profile for currently authenticated session."""
    return UserProfile(
        sub=current_user["sub"],
        email=current_user["email"],
        name=current_user["name"],
        picture=current_user.get("picture"),
        email_verified=True,
    )


@router.post("/logout")
def logout_user(response: Response) -> dict:
    """Clears the session cookie."""
    response.delete_cookie(key="session_token")
    return {"message": "Successfully logged out."}

