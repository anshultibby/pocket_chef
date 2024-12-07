import logging
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate
from ..services.pantry import get_pantry_manager
from ..services.receipt_parser import ReceiptParser

router = APIRouter()
receipt_parser = ReceiptParser()
pantry_manager = get_pantry_manager()

# Set up logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create console handler with formatting
console_handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

@router.post("/items", response_model=List[PantryItem])
def add_items(items: List[PantryItemCreate]):
    new_items = []
    for item in items:
        pantry_item = pantry_manager.add_item(item)
        new_items.append(pantry_item)
    return new_items

@router.get("/items", response_model=List[PantryItem])
def get_items():
    return pantry_manager.get_items()

@router.put("/items/{item_id}", response_model=PantryItem)
def update_item(item_id: str, item_update: PantryItemUpdate):
    current_item = pantry_manager.get_item(item_id)
    if not current_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    updated_item = pantry_manager.update_item(item_id, item_update)
    return updated_item

@router.delete("/items/{item_id}")
def delete_item(item_id: str):
    current_item = pantry_manager.get_item(item_id)
    if not current_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    pantry_manager.delete_item(item_id)
    return {"message": "Item deleted"}

@router.post("/upload", response_model=List[PantryItemCreate])
async def upload_receipt(file: UploadFile = File(...)):
    try:
        logger.info(f"Received file: {file.filename}, content_type: {file.content_type}")
        
        receipt_parser = ReceiptParser()
        items = await receipt_parser.parse_receipt(file)
        return items
    except HTTPException as e:
        logger.error(f"HTTP Exception: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Error processing receipt: {str(e)}"
        )
