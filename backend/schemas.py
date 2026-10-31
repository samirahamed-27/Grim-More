"""
Potion Pantry - Request and Response Schemas (backend/schemas.py)
Defines Pydantic models for restock purchases, search queries, and unified error responses.
"""

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

