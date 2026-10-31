"""
Potion Pantry - Restock Routes (backend/routes/restock.py)
Endpoints for searching ingredients and registering restock purchases.
"""

from typing import List
from fastapi import APIRouter, HTTPException, Query
from backend.db import record_purchase, search_ingredients
from backend.schemas import (
    IngredientSearchResult,
    PurchaseRequest,
    PurchaseResponse,
)

router = APIRouter(prefix="/api", tags=["restock"])


@router.get("/ingredients/search", response_model=List[IngredientSearchResult])
def search_ingredients_route(
    q: str = Query(..., min_length=1, max_length=50, description="Search term"),
) -> List[IngredientSearchResult]:
    """Search ingredients by partial name match up to 10 results."""
    # Strip whitespace and search database with escaped wildcards
    clean_query = q.strip()
    if not clean_query:
        raise HTTPException(status_code=422, detail="Search query cannot be empty.")
    matches = search_ingredients(query=clean_query, limit=10)
    return [IngredientSearchResult(**item) for item in matches]


@router.post("/purchases", response_model=PurchaseResponse)
def create_purchase_route(payload: PurchaseRequest) -> PurchaseResponse:
    """Restock an ingredient by recording a purchase and updating inventory."""
    # Execute database update inside an atomic transaction
    updated = record_purchase(
        ingredient_id=payload.ingredient_id,
        quantity=payload.quantity,
    )
    if not updated:
        raise HTTPException(status_code=404, detail="Ingredient not found.")
    return PurchaseResponse(**updated)

