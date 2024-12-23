from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .pantry import Nutrition


class DifficultyLevel(str, Enum):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"


class RecipeIngredient(BaseModel):
    pantry_item_id: UUID
    quantity: float
    unit: str
    notes: Optional[str] = None
    is_optional: bool = False


class RecipeData(BaseModel):
    name: str
    ingredients: List[RecipeIngredient]
    instructions: List[str]
    preparation_time: int = Field(gt=0, description="Preparation time in minutes")
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    calculated_nutrition: Dict[str, Nutrition] = Field(
        default_factory=lambda: {
            "total": Nutrition(),
            "per_serving": Nutrition(),
        }
    )
    servings: int = Field(ge=1, default=1)
    category: str


class RecipeCreate(BaseModel):
    data: RecipeData
    is_public: bool = False


class RecipeResponse(BaseModel):
    id: UUID
    data: RecipeData
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
    availability_percentage: float = Field(ge=0, le=100)
    substitute_suggestions: Dict[UUID, List[UUID]] = Field(
        default_factory=dict,
        description="Map of missing ingredient IDs to possible substitute ingredient IDs",
    )
