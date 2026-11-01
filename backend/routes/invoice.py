"""
Potion Pantry - AI Invoice & E-Bill Scanner Routes (backend/routes/invoice.py)
Endpoints to upload and scan supplier invoices/e-bills via Gemini Vision OCR,
and confirm detected restock items to atomically increment inventory in SQLite.
"""

from typing import Any, Dict, List
from fastapi import APIRouter, File, HTTPException, UploadFile, status

from backend.db import get_active_events, get_ingredients, record_invoice_purchases
from backend.invoice_parser import (
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE_BYTES,
    parse_invoice_document,
)
from backend.schemas import (
    InvoiceConfirmRequest,
    InvoiceConfirmResponse,
    InvoiceScanResponse,
)

router = APIRouter(prefix="/api/invoice", tags=["invoice"])


@router.post("/scan", response_model=InvoiceScanResponse)
async def scan_invoice_route(file: UploadFile = File(...)) -> InvoiceScanResponse:
    """
    Upload an invoice/receipt image or PDF to extract line items using Gemini Vision OCR
    or fallback parser. Returns structured line items and detected quantities.
    """
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Filename is missing.",
        )

    # Validate file extension
    ext = "." + file.filename.split(".")[-1].lower() if "." in file.filename else ""
    valid_exts = {".png", ".jpg", ".jpeg", ".webp", ".pdf"}
    if ext not in valid_exts:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '{ext}'. Allowed types: .png, .jpg, .jpeg, .webp, .pdf",
        )

    # Determine MIME type
    content_type = file.content_type or ""
    if content_type not in ALLOWED_MIME_TYPES:
        # Fall back to extension mapping
        mime_map = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
            ".pdf": "application/pdf",
        }
        content_type = mime_map.get(ext, "application/octet-stream")

    # Read and validate file size (max 10MB)
    file_bytes = await file.read()
    if len(file_bytes) == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Uploaded file is empty.",
        )
    if len(file_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {MAX_FILE_SIZE_BYTES // (1024 * 1024)}MB.",
        )

    # Parse invoice using Gemini Multimodal or rule-based fallback
    result = parse_invoice_document(
        file_bytes=file_bytes,
        filename=file.filename,
        mime_type=content_type,
    )

    return InvoiceScanResponse(**result)


@router.post("/confirm", response_model=InvoiceConfirmResponse)
def confirm_invoice_items(payload: InvoiceConfirmRequest) -> InvoiceConfirmResponse:
    """
    Accepts confirmed ingredient line items and atomically increments current_stock
    in SQLite within a single transaction. Recalculates cover days and inventory state.
    """
    if not payload.items:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one ingredient item must be confirmed.",
        )

    # Transform payload items to dict list
    items_dict: List[Dict[str, Any]] = [
        {"ingredient_id": item.ingredient_id, "quantity": item.quantity}
        for item in payload.items
    ]

    # Execute atomic SQLite transaction (record purchases and increment current_stock)
    updated_ingredients = record_invoice_purchases(
        items=items_dict,
        invoice_reference=payload.invoice_reference,
    )

    if not updated_ingredients:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="None of the specified ingredient IDs could be found in the database.",
        )

    # Fetch updated ingredients to return latest inventory levels
    all_ingredients = get_ingredients()
    total_added = sum(item.quantity for item in payload.items)

    return InvoiceConfirmResponse(
        message=f"Successfully replenished {len(payload.items)} item(s) (total +{total_added} units) into inventory.",
        invoice_reference=payload.invoice_reference or "RECEIPT-CONFIRMED",
        updated_ingredients=all_ingredients,
    )

