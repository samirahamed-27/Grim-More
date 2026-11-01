"""
Potion Pantry - Request and Response Schemas (backend/schemas.py)
Defines Pydantic models for restock purchases, search queries, and unified error responses.
"""

from typing import Any, Dict, List, Optional
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


class InvoiceScanItem(BaseModel):
    """Line item extracted and matched by the invoice scanner."""
    ingredient_id: int = Field(..., gt=0, description="Ingredient ID in database")
    ingredient_name: str = Field(..., description="Canonical ingredient name")
    detected_raw_text: str = Field(..., description="Original raw line item text from invoice")
    quantity: int = Field(..., ge=1, le=MAX_QUANTITY, description="Quantity detected")
    confidence: float = Field(..., ge=0.0, le=1.0, description="OCR and match confidence score")


class UnmatchedScanItem(BaseModel):
    """Line item from invoice that could not be mapped to the ingredient roster."""
    raw_text: str
    quantity: Optional[int] = None
    reason: str = "Unknown ingredient or auxiliary item"


class InvoiceScanResponse(BaseModel):
    """Structured extraction result returned by POST /api/invoice/scan."""
    invoice_number: str
    supplier: str
    date: str
    items: List[InvoiceScanItem]
    unmatched_items: List[UnmatchedScanItem] = []


class InvoiceConfirmItem(BaseModel):
    """Item approved by merchant to be added to inventory."""
    ingredient_id: int = Field(..., gt=0)
    quantity: int = Field(..., ge=1, le=MAX_QUANTITY)


class InvoiceConfirmRequest(BaseModel):
    """Payload for POST /api/invoice/confirm."""
    items: List[InvoiceConfirmItem] = Field(..., min_length=1)
    invoice_reference: str = Field(default="")


class InvoiceConfirmResponse(BaseModel):
    """Response returned upon inventory batch increment."""
    message: str
    invoice_reference: str
    updated_ingredients: List[Dict[str, Any]]



