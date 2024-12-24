from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .pantry import CustomBaseModel, Nutrition


class RecipeIngredient(CustomBaseModel):
    name: str
    quantity: float
    unit: str
    pantry_item_id: Optional[UUID] = Field(
        default=None, description="dont generate this, we will link to db later"
    )
    is_optional: bool = False
    substitutes: List[str] = Field(default_factory=list)


class RecipeData(CustomBaseModel):
    name: str
    ingredients: List[RecipeIngredient]
    instructions: List[str]
    preparation_time: int = Field(gt=0, description="Preparation time in minutes")
    servings: int = Field(ge=1, default=1)
    category: str = Field(description="Breakfast, Lunch, Dinner, or Snack")

    def __str__(self) -> str:
        """Format recipe data in a readable way"""
        parts = [
            f"Recipe: {self.name}",
            f"Category: {self.category}",
            f"Prep Time: {self.preparation_time} mins",
            f"Servings: {self.servings}",
            "Ingredients:",
            *[f"- {ingredient}" for ingredient in self.ingredients],
            "Instructions:",
            *[f"{i+1}. {step}" for i, step in enumerate(self.instructions)],
        ]
        return "\n".join(parts)


class ListOfRecipeData(BaseModel):
    recipes: List[RecipeData]


class RecipeCreate(BaseModel):
    data: RecipeData
    is_public: bool = False


class RecipeResponse(BaseModel):
    id: UUID
    data: RecipeData
    created_at: datetime
    updated_at: datetime
    user_id: UUID

    @property
    def availability_percentage(self) -> float:
        """Calculate percentage of available ingredients"""
        total = len(self.data.ingredients)
        if total == 0:
            return 0
        available = len([i for i in self.data.ingredients if i.pantry_item_id])
        return (available / total) * 100


class RecipePreferences(CustomBaseModel):
    """
    Model for recipe generation preferences
    """

    cuisine: List[str] = Field(
        default_factory=list,
        description="List of preferred cuisines (e.g., Italian, Mexican, Asian)",
    )
    meal_types: List[str] = Field(
        default_factory=list,
        description="Types of meals to generate (e.g., Breakfast, Lunch, Dinner, Snack)",
    )
    dietary: List[str] = Field(
        default_factory=list,
        description="List of dietary restrictions (e.g., Vegetarian, Vegan, Gluten-Free)",
    )
    nutrition_goals: List[str] = Field(
        default_factory=list,
        description="Nutrition preferences (e.g., High Protein, Low Carb)",
    )
    max_prep_time: Optional[int] = Field(
        None, description="Maximum preparation time in minutes", ge=0
    )
    serving_size: int = Field(default=2, ge=1, le=12, description="Number of servings")
    recipes_per_meal: int = Field(
        default=3, ge=1, le=5, description="Number of recipes to generate per meal type"
    )
    custom_preferences: Optional[str] = Field(
        None, description="Additional custom preferences in text form"
    )

    def __str__(self) -> str:
        """Format preferences in a readable way"""
        parts = []
        if self.cuisine:
            parts.append(f"Cuisines: {', '.join(self.cuisine)}")
        if self.meal_types:
            parts.append(f"Meal Types: {', '.join(self.meal_types)}")
        if self.dietary:
            parts.append(f"Dietary: {', '.join(self.dietary)}")
        if self.nutrition_goals:
            parts.append(f"Nutrition Goals: {', '.join(self.nutrition_goals)}")
        if self.max_prep_time:
            parts.append(f"Max Prep Time: {self.max_prep_time} mins")
        parts.append(f"Serving Size: {self.serving_size}")
        parts.append(f"Recipes Per Meal: {self.recipes_per_meal}")
        if self.custom_preferences:
            parts.append(f"Custom: {self.custom_preferences}")
        return "\n".join(parts)

    class Config:
        json_schema_extra = {
            "example": {
                "cuisine": ["Italian", "Mexican"],
                "meal_types": ["Dinner", "Lunch"],
                "dietary": ["Vegetarian"],
                "nutrition_goals": ["High Protein", "Low Carb"],
                "max_prep_time": 30,
                "serving_size": 4,
                "recipes_per_meal": 3,
                "custom_preferences": "Spicy food preferred",
            }
        }
