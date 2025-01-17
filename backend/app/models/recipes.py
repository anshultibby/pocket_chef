from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from .pantry import CustomBaseModel, Nutrition


class RecipeIngredient(CustomBaseModel):
    name: str = Field(
        description="If you are using a pantry item, use the exact pantry item name so that we can match it"
    )
    quantity: float
    unit: str = Field(
        description="unit of the ingredient, try use same unit as pantry item"
    )
    pantry_item_id: Optional[UUID] = Field(
        default=None, description="dont generate this, we will link to db later"
    )
    is_optional: bool = False
    protein: Optional[float] = Field(
        None,
        description="Total protein content of the ingredient (so for 4 eggs itll be 4*protein per egg)",
    )
    calories: Optional[float] = Field(
        None, description="Total calories content of the ingredient"
    )
    fat: Optional[float] = Field(None, description="Total fat")
    carbs: Optional[float] = Field(None, description="Total carbs")
    fiber: Optional[float] = Field(None, description="Total fiber")
    substitutes: List[str] = Field(default_factory=list)


class RecipeData(CustomBaseModel):
    name: str
    ingredients: List[RecipeIngredient]
    instructions: List[str]
    preparation_time: int = Field(gt=0, description="Preparation time in minutes")
    servings: int = Field(ge=1, default=1)
    category: str = Field(description="Breakfast, Lunch, Dinner, or Snack")
    price: Optional[float] = Field(
        None, description="Price of the ingredients of the recipe"
    )
    nutrition: Optional[Nutrition] = Field(
        None,
        description="Nutrition stats of the recipe, \
use standard unit, something like 100 calories, 10 grams of protein, \
20 g of carbs, etc per serving size",
    )

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
        if self.price is not None:
            parts.append(f"Price: ${self.price:.2f}")
        if self.nutrition is not None:
            parts.append(f"Nutrition: {self.nutrition}")
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
    max_calories: Optional[int] = Field(
        None, description="Maximum calories per serving", ge=0
    )
    min_protein: Optional[int] = Field(
        None, description="Minimum protein per serving in grams", ge=0
    )
    serving_size: int = Field(default=2, ge=1, le=12, description="Number of servings")
    num_recipes: int = Field(
        default=6, ge=1, le=8, description="Number of recipes to generate"
    )
    custom_preferences: Optional[str] = Field(
        None, description="Additional custom preferences in text form"
    )

    def __str__(self) -> str:
        """Format preferences in a readable way"""
        parts = []

        # Handle list fields
        for field_name in ["cuisine", "meal_types", "dietary", "nutrition_goals"]:
            if values := getattr(self, field_name):
                parts.append(
                    f"{field_name.replace('_', ' ').title()}: {', '.join(values)}"
                )

        # Handle numeric fields with units
        units = {
            "max_prep_time": "mins",
            "max_calories": "kcal",
            "min_protein": "g",
            "serving_size": "servings",
            "num_recipes": "recipes",
        }

        for field_name, unit in units.items():
            if value := getattr(self, field_name):
                parts.append(f"{field_name.replace('_', ' ').title()}: {value} {unit}")

        # Handle custom preferences
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
                "num_recipes": 3,
                "custom_preferences": "Spicy food preferred",
            }
        }
