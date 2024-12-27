from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional, Union
from uuid import UUID

from pydantic import BaseModel, Field

from .recipes import RecipeResponse


class InteractionType(str, Enum):
    SAVE = "save"
    RATE = "rate"
    COOK = "cook"


# Data models for different interaction types
class SaveData(BaseModel):
    folder: Optional[str] = None
    notes: Optional[str] = None


class RateData(BaseModel):
    rating: float = Field(ge=0, le=5)
    difficulty_rating: Optional[float] = Field(None, ge=0, le=5)
    would_make_again: Optional[bool] = None
    review: Optional[str] = None


class CookData(BaseModel):
    servings_made: int = Field(gt=0)
    ingredients_used: Dict[str, float] = Field(
        description="Map of pantry_item_id to quantity used"
    )
    notes: Optional[str] = None
    modifications: List[str] = Field(default_factory=list)


# Combined interaction models
class RecipeInteractionCreate(BaseModel):
    type: InteractionType
    data: Union[SaveData, RateData, CookData]


class RecipeInteraction(RecipeInteractionCreate):
    id: UUID
    recipe_id: UUID
    user_id: UUID
    created_at: datetime
    is_saved: bool
    rating: Optional[float] = None


class RecipeInteractionResponse(RecipeInteraction):
    recipe: RecipeResponse
