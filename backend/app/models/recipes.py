from pydantic import BaseModel
from typing import List, Optional, Dict

class NutritionalInfo(BaseModel):
    calories: int
    protein: float
    carbs: float
    fat: float

class Recipe(BaseModel):
    id: str
    name: str
    ingredients: List[str]
    instructions: List[str]
    preparationTime: str
    difficulty: str
    nutritionalInfo: NutritionalInfo
    isSaved: bool = False

class RecipeCreate(BaseModel):
    ingredients: List[str]
    preferences: Optional[Dict[str, str]] = None
