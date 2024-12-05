from pydantic import BaseModel
from typing import List, Optional, Dict

class NutritionalInfo(BaseModel):
    calories: float
    protein: float
    carbs: float
    fat: float

class Recipe(BaseModel):
    id: str
    name: str
    ingredients: List[str]
    instructions: List[str]
    preparation_time: Optional[str] = None
    difficulty: Optional[str] = None
    nutritional_info: Optional[NutritionalInfo] = None
    is_saved: bool = False

class RecipeCreate(BaseModel):
    ingredients: List[str]
    preferences: Optional[Dict[str, str]] = None
