import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate
from ..services.auth import get_current_user
from ..services.pantry import get_pantry_manager
from ..services.receipt_parser import ReceiptParser

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/items", response_model=List[PantryItem])
async def add_items(
    items: List[PantryItemCreate],
    user_id: UUID = Depends(get_current_user),
    # The security dependency provides the auth token needed for Supabase API calls
    # This token is passed to pantry_manager.add_item() to authenticate requests
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer())
):
    try:
        logger.info(f"Adding items for user {user_id}")
        pantry_manager = get_pantry_manager()
        new_items = []
        
        for item in items:
            try:
                pantry_item = pantry_manager.add_item(item, user_id, credentials.credentials)
                new_items.append(pantry_item)
            except Exception as e:
                logger.error(f"Error adding item: {str(e)}")
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Failed to add item: {str(e)}"
                )
                
        return new_items
        
    except Exception as e:
        logger.error(f"Error in add_items: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )

@router.get("/items", response_model=List[PantryItem])
async def get_items(user_id: UUID = Depends(get_current_user)):
    return pantry_manager.get_items(user_id)

@router.put("/items/{item_id}", response_model=PantryItem)
async def update_item(
    item_id: str, 
    item_update: PantryItemUpdate,
    user_id: UUID = Depends(get_current_user)
):
    current_item = pantry_manager.get_item(item_id)
    if not current_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = pantry_manager.update_item(item_id, item_update)
    return updated_item

@router.delete("/items/{item_id}")
async def delete_item(
    item_id: str,
    user_id: UUID = Depends(get_current_user)
):
    try:
        pantry_manager.delete_item(item_id)
        return {"message": "Item deleted"}
    except Exception as e:
        raise HTTPException(status_code=404, detail="Item not found")

@router.post("/upload", response_model=List[PantryItemCreate])
async def upload_receipt(
    file: UploadFile,
    user_id: UUID = Depends(get_current_user)
):
    try:
        receipt_parser = ReceiptParser()
        items = await receipt_parser.parse_receipt(file, user_id)
        return items
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing receipt: {str(e)}"
        )

@router.delete("/items")
async def clear_pantry(user_id: UUID = Depends(get_current_user)):
    try:
        pantry_manager.clear_pantry()
        return {"message": "Pantry cleared"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
