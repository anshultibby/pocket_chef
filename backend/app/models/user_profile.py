from datetime import datetime
from enum import Enum
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CookingExperience(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"


class UserProfile(BaseModel):
    id: UUID
    user_id: UUID
    dietary_preferences: List[str] = Field(default_factory=list)
    goals: List[str] = Field(default_factory=list)
    default_servings: int = Field(ge=1, le=12, default=2)
    cooking_experience: str = Field(default="beginner")
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class UserProfileUpdate(BaseModel):
    dietary_preferences: List[str] | None = None
    goals: List[str] | None = None
    default_servings: int | None = None
    cooking_experience: str | None = None
    notes: str | None = None
