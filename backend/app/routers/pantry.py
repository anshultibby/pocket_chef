import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Body, Depends, HTTPException, UploadFile

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate
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
    items: List[PantryItemCreate] = Body(...),
    current_user: dict = Depends(get_current_user),
):
    try:
        added_items = []
        for item in items:
            added_item = await pantry_manager.add_single_item(
                item=item, user_id=UUID(current_user["id"])
            )
            added_items.append(added_item)
        return added_items
    except Exception as e:
        logger.error(f"Error adding items: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("/items/{item_id}", response_model=PantryItem)
async def update_item(
    item_id: str,
    update_data: PantryItemUpdate,
    current_user: dict = Depends(get_current_user),
):
    try:
        result = pantry_manager.update_item(
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
        if not pantry_manager.delete_item(
            item_id=item_id, user_id=UUID(current_user["id"])
        ):
            raise HTTPException(status_code=404, detail="Item not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/clear")
async def clear_pantry(current_user: dict = Depends(get_current_user)):
    try:
        pantry_manager.clear_pantry(user_id=UUID(current_user["id"]))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/upload", response_model=List[PantryItem])
async def upload_receipt(
    file: UploadFile, current_user: dict = Depends(get_current_user)
):
    try:
        return await pantry_manager.add_receipt_items(
            file=file, user_id=UUID(current_user["id"])
        )
    except Exception as e:
        logger.error(f"Error processing receipt: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
