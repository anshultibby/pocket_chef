from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from ..models.pantry import NutritionalInfo


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class RecipeIngredient(BaseModel):
    ingredient_id: UUID
    quantity: float
    unit: str
    notes: Optional[str] = None


class RecipeData(BaseModel):
    name: str
    ingredients: List[RecipeIngredient]
    instructions: List[str]
    preparation_time: int
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    calculated_nutrition: Dict[str, NutritionalInfo] = {
        "total": NutritionalInfo(),
        "per_serving": NutritionalInfo(),
    }
    servings: int = 1
    category: str


class RecipeCreate(BaseModel):
    data: RecipeData
    is_public: bool = False


class RecipeResponse(BaseModel):
    id: UUID
    data: RecipeData
    recipe_type: str
    is_public: bool
    original_recipe_id: Optional[UUID] = None
    created_at: datetime
    updated_at: datetime
    user_id: UUID


class CategoryRequest(BaseModel):
    category: str
    count: int


class RecipeGenerateRequest(BaseModel):
    categories: List[CategoryRequest]


class RecipeWithAvailability(BaseModel):
    recipe: RecipeResponse
    available_ingredients: List[UUID]
    missing_ingredients: List[UUID]
    availability_percentage: float
