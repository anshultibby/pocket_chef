import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate
from ..services.auth import get_current_user
from ..services.pantry import PantryManager
from ..services.receipt_parser import ReceiptParser

router = APIRouter(prefix="/pantry", tags=["pantry"])
logger = logging.getLogger(__name__)
pantry_manager = PantryManager()

@router.get("/items", response_model=List[PantryItem])
async def get_items(current_user: dict = Depends(get_current_user)):
    try:
        items = pantry_manager.get_items(
            user_id=UUID(current_user['id'])
        )
        return items
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/items", response_model=List[PantryItem])
async def add_items(
    request: dict,
    current_user: dict = Depends(get_current_user)
):
    try:
        items = request.get('items', [])
        if not items:
            raise HTTPException(status_code=400, detail="No items provided")
            
        return [
            pantry_manager.add_item(
                item=PantryItemCreate(**item),
                user_id=UUID(current_user['id'])
            )
            for item in items
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/items/{item_id}", response_model=PantryItem)
async def update_item(
    item_id: str,
    update_data: PantryItemUpdate,
    current_user: dict = Depends(get_current_user)
):
    try:
        result = pantry_manager.update_item(
            item_id=item_id,
            update_data=update_data,
            user_id=UUID(current_user['id'])
        )
        if not result:
            raise HTTPException(status_code=404, detail="Item not found")
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/items/{item_id}")
async def delete_item(
    item_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        if not pantry_manager.delete_item(
            item_id=item_id,
            user_id=UUID(current_user['id'])
        ):
            raise HTTPException(status_code=404, detail="Item not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/clear")
async def clear_pantry(current_user: dict = Depends(get_current_user)):
    try:
        pantry_manager.clear_pantry(
            user_id=UUID(current_user['id'])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload", response_model=List[PantryItemCreate])
async def upload_receipt(
    file: UploadFile,
    current_user: dict = Depends(get_current_user)
):
    try:
        receipt_parser = ReceiptParser()
        items = await receipt_parser.parse_receipt(file, UUID(current_user['id']))
        return items
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing receipt: {str(e)}"
        )

