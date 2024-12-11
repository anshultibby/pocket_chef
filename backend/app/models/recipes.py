from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from uuid import UUID
from enum import Enum

from pydantic import BaseModel, Field


class MealCategory(str, Enum):
    BREAKFAST = "breakfast"
    LUNCH = "lunch"
    DINNER = "dinner"
    SNACK = "snack"

class NutritionalInfo(BaseModel):
    calories: int
    protein: float
    carbs: float
    fat: float
    
class RecipeBase(BaseModel):
    name: str
    ingredients: List[str]
    instructions: List[str]
    preparation_time: Optional[timedelta] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    nutritional_info: Optional[NutritionalInfo] = None
    is_saved: bool = False
    meal_category: MealCategory
    user_id: UUID

class RecipeCreate(BaseModel):
    name: str
    ingredients: List[str]
    instructions: List[str]
    preparation_time: Optional[str] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    nutritional_info: Optional[NutritionalInfo] = None
    is_saved: bool = True
    meal_category: MealCategory

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

class RecipeGenerateRequest(BaseModel):
    """Model for recipe generation request"""
    ingredients: List[str]
    preferences: Optional[str] = None

class RecipeSave(BaseModel):
    """Model for saving a recipe by ID"""
    recipe_id: UUID

class RecipeResponse(BaseModel):
    """Model for recipe responses"""
    id: UUID
    name: str
    ingredients: List[str]
    instructions: List[str]
    preparation_time: Optional[timedelta] = None
    difficulty: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")
    nutritional_info: Optional[NutritionalInfo] = None
    is_saved: bool = False
    created_at: datetime
    updated_at: datetime
