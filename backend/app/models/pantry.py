from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field

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
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
