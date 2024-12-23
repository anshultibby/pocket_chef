import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, Request, UploadFile
from pydantic import ValidationError

from ..models.pantry import (
    Nutrition,
    PantryItem,
    PantryItemCreate,
    PantryItemData,
    PantryItemUpdate,
)
from ..services.auth import get_current_user
from ..services.pantry import get_pantry_manager

router = APIRouter(prefix="/pantry", tags=["pantry"])
logger = logging.getLogger(__name__)
pantry_manager = get_pantry_manager()


@router.get("/items", response_model=List[PantryItem])
async def get_items(current_user: dict = Depends(get_current_user)):
    try:
        items = await pantry_manager.get_items(user_id=UUID(current_user["id"]))
        return items
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/items", response_model=List[PantryItem])
async def add_items(
    request: Request,
    items: List[PantryItemCreate] = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        raw_body = await request.json()
        # Validate each item individually to get specific validation errors
        for item_data in raw_body:
            try:
                # Explicitly validate the data structure
                PantryItemCreate(
                    data=PantryItemData(**item_data["data"]),
                    nutrition=item_data["nutrition"],
                )
            except ValidationError as e:
                logger.error("Validation error for item: %s", e.errors())
                raise HTTPException(status_code=422, detail=e.errors())

        added_items = []
        for item in items:
            added_item = await pantry_manager.add_single_item(
                item=item, user_id=UUID(current_user["id"])
            )
            added_items.append(added_item)
        return added_items
    except ValidationError as e:
        logger.error("Validation error: %s", e.errors())
        raise HTTPException(status_code=422, detail=e.errors())
    except Exception as e:
        logger.error("Error adding items: %s", str(e))
        logger.exception("Full traceback:")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/items/{item_id}", response_model=PantryItem)
async def update_item(
    item_id: str,
    update_data: PantryItemUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        result = await pantry_manager.update_item(
            item_id=item_id, update_data=update_data, user_id=UUID(current_user["id"])
        )
        if not result:
            raise HTTPException(status_code=404, detail="Item not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/items/{item_id}")
async def delete_item(item_id: str, current_user: dict = Depends(get_current_user)):
    try:
        result = await pantry_manager.delete_item(
            item_id=item_id, user_id=UUID(current_user["id"])
        )
        if not result:
            raise HTTPException(status_code=404, detail="Item not found")
        return {"status": "success"}
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=404, detail=str(e))
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/clear")
async def clear_pantry(current_user: dict = Depends(get_current_user)):
    try:
        await pantry_manager.clear_pantry(user_id=UUID(current_user["id"]))
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload", response_model=List[PantryItemCreate])
async def upload_receipt(
    file: UploadFile, current_user: dict = Depends(get_current_user)
):
    """Process receipt and return suggested items without storing"""
    try:
        return await pantry_manager.process_receipt(
            file=file, user_id=UUID(current_user["id"])
        )
    except Exception as e:
        logger.error(f"Error processing receipt: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/receipt/process")
async def process_receipt(
    file: UploadFile, current_user: dict = Depends(get_current_user)
) -> List[PantryItemCreate]:
    """Process receipt and return suggested items without storing"""
    try:
        return await pantry_manager.process_receipt(
            file=file, user_id=UUID(current_user["id"])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/receipt/confirm")
async def confirm_receipt_items(
    items: List[PantryItemCreate], current_user: dict = Depends(get_current_user)
) -> List[PantryItem]:
    """Store confirmed receipt items"""
    try:
        return await pantry_manager.add_receipt_items(
            items=items, user_id=UUID(current_user["id"])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
