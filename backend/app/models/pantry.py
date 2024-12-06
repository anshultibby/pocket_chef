from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PantryItem(BaseModel):
    id: str
    name: str
    quantity: float
    unit: str
    category: Optional[str] = None
    expiry_date: Optional[datetime] = None
    added_date: datetime
    notes: Optional[str] = None

class PantryItemCreate(BaseModel):
    name: str
    quantity: float
    unit: str
    category: Optional[str] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None

class PantryItemUpdate(BaseModel):
    quantity: Optional[float] = None
    unit: Optional[str] = None
    expiry_date: Optional[datetime] = None
    category: Optional[str] = None
    notes: Optional[str] = None
