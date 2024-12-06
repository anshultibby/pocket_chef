from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class PantryItemBase(BaseModel):
    name: str
    quantity: float
    unit: str
    category: Optional[str] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None

class PantryItemCreate(PantryItemBase):
    pass

class PantryItemUpdate(BaseModel):
    name: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    category: Optional[str] = None
    expiry_date: Optional[datetime] = None
    notes: Optional[str] = None

class PantryItem(PantryItemBase):
    id: str
    added_date: datetime
