from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List
from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate
from ..services.receipt_parser import ReceiptParser
import uuid
from datetime import datetime

router = APIRouter()
receipt_parser = ReceiptParser()

# In-memory storage (replace with database in production)
pantry_items = {}

@router.post("/upload-receipt", response_model=List[PantryItem])
async def upload_receipt(file: UploadFile = File(...)):
    try:
        items = await receipt_parser.parse_receipt(file)
        # Convert to PantryItem and store
        new_items = []
        for item in items:
            pantry_item = PantryItem(
                id=str(uuid.uuid4()),
                added_date=datetime.now(),
                **item.dict()
            )
            pantry_items[pantry_item.id] = pantry_item
            new_items.append(pantry_item)
        return new_items
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/items", response_model=List[PantryItem])
async def add_items(items: List[PantryItemCreate]):
    new_items = []
    for item in items:
        pantry_item = PantryItem(
            id=str(uuid.uuid4()),
            added_date=datetime.now(),
            **item.dict()
        )
        pantry_items[pantry_item.id] = pantry_item
        new_items.append(pantry_item)
    return new_items

@router.get("/items", response_model=List[PantryItem])
async def get_items():
    return list(pantry_items.values())

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

@router.post("/upload")
async def upload_receipt(file: UploadFile):
    try:
        receipt_parser = ReceiptParser()
        items = await receipt_parser.parse_receipt(file)
        return items
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
