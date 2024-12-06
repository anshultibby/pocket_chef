import logging
import uuid
from datetime import datetime
from typing import List

from fastapi import APIRouter, File, HTTPException, UploadFile

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate
from ..services.receipt_parser import ReceiptParser

router = APIRouter()
receipt_parser = ReceiptParser()

# Set up logger
logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Create console handler with formatting
console_handler = logging.StreamHandler()
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
console_handler.setFormatter(formatter)
logger.addHandler(console_handler)

# In-memory storage (replace with database in production)
pantry_items = {}

@router.post("/items", response_model=List[PantryItem])
async def add_items(items: List[PantryItemCreate]):
    new_items = []
    for item in items:
        pantry_item = PantryItem(
            id=str(uuid.uuid4()),
            added_date=datetime.now(),
            name=item.name,
            quantity=item.quantity,
            unit=item.unit,
            category=item.category,
            expiry_date=item.expiry_date,
            notes=item.notes
        )
        pantry_items[pantry_item.id] = pantry_item
        new_items.append(pantry_item)
    return new_items

@router.get("/items", response_model=List[PantryItem])
async def get_items():
    # Sort items by category and name for better organization
    sorted_items = sorted(
        pantry_items.values(),
        key=lambda x: (x.category or "Uncategorized", x.name)
    )
    
    # Add some logging for debugging
    logger.info(f"Returning {len(sorted_items)} pantry items")
    
    # Format dates in a more readable way for each item
    for item in sorted_items:
        if item.added_date:
            item.added_date = item.added_date.strftime("%Y-%m-%d %H:%M")
        if item.expiry_date:
            item.expiry_date = item.expiry_date.strftime("%Y-%m-%d")
    
    return sorted_items

@router.put("/items/{item_id}", response_model=PantryItem)
async def update_item(item_id: str, item_update: PantryItemUpdate):
    if item_id not in pantry_items:
        raise HTTPException(status_code=404, detail="Item not found")
    
    current_item = pantry_items[item_id]
    update_data = item_update.dict(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(current_item, field, value)
    
    return current_item

@router.delete("/items/{item_id}")
async def delete_item(item_id: str):
    if item_id not in pantry_items:
        raise HTTPException(status_code=404, detail="Item not found")
    
    del pantry_items[item_id]
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
