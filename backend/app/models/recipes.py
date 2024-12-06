from datetime import datetime, timedelta
from typing import Optional, List, Dict
from uuid import UUID
from pydantic import BaseModel, Field

class NutritionalInfo(BaseModel):
    calories: int
    protein: float
    carbs: float
    fat: float
    
class RecipeBase(BaseModel):
    name: str
    ingredients: List[Dict[str, str]]  # [{"name": "flour", "amount": "2", "unit": "cups"}]
    instructions: List[str]
    preparation_time: Optional[timedelta] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    nutritional_info: Optional[NutritionalInfo] = None
    is_saved: bool = False

class RecipeCreate(RecipeBase):
    pass

class RecipeUpdate(BaseModel):
    name: Optional[str] = None
    ingredients: Optional[List[Dict[str, str]]] = None
    instructions: Optional[List[str]] = None
    preparation_time: Optional[timedelta] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    nutritional_info: Optional[NutritionalInfo] = None
    is_saved: Optional[bool] = None

class Recipe(RecipeBase):
    id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
