"""
Potion Pantry - Request and Response Schemas (backend/schemas.py)
Defines Pydantic models for restock purchases, search queries, and unified error responses.
"""

from typing import Optional
from pydantic import BaseModel, Field

# Maximum allowed quantity for a single purchase to prevent integer overflow
MAX_QUANTITY: int = 100_000


class IngredientSearchResult(BaseModel):
    """Returned item for ingredient search results."""
    id: int
    name: str
    current_stock: int


class PurchaseRequest(BaseModel):
    """Payload for registering an ingredient restock purchase."""
    ingredient_id: int = Field(..., gt=0, description="Positive integer ingredient ID")
    quantity: int = Field(
        ...,
        ge=1,
        le=MAX_QUANTITY,
        description=f"Purchase quantity between 1 and {MAX_QUANTITY}",
    )


class PurchaseResponse(BaseModel):
    """Updated ingredient inventory details returned upon restock."""
    id: int
    name: str
    current_stock: int


class ErrorResponse(BaseModel):
    """Standardized error response shape across the entire API."""
    error: str


class GoogleAuthRequest(BaseModel):
    """Payload sent by frontend upon successful Google Identity sign in."""
    credential: str = Field(..., min_length=10, description="Google OAuth ID token JWT")


class EmailAuthRequest(BaseModel):
    """Payload sent by frontend to authenticate directly with an email address."""
    email: str = Field(..., min_length=3, max_length=120, description="Email address")
    name: Optional[str] = Field(None, max_length=100, description="Optional display name")


class UserProfile(BaseModel):
    """User profile attributes extracted and verified from Google identity."""
    sub: str
    email: str
    name: str
    picture: Optional[str] = None
    email_verified: bool = True


class GoogleAuthResponse(BaseModel):
    """Session credential and profile payload returned to client."""
    session_token: str
    user: UserProfile


class AuthConfigResponse(BaseModel):
    """Public authentication configuration parameters for frontend initialization."""
    google_client_id: str


