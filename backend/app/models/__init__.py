from typing import List, Optional, Dict
from pydantic import BaseModel, Field
from enum import Enum

class Category(str, Enum):
    PRODUCE = 'produce'
    DAIRY = 'dairy'
    MEAT = 'meat'
    PANTRY = 'pantry'
    SPICES = 'spices'

class MealCategory(str, Enum):
    BREAKFAST = 'breakfast'
    LUNCH = 'lunch'
    DINNER = 'dinner'
    SNACK = 'snack'

class IngredientAnalysis(BaseModel):
    """Response model for analyzing a single ingredient"""
    canonical_name: str = Field(description="Standardized name in singular form, lowercase")
    standard_unit: str = Field(description="grams|milliliters|units|pinch")
    conversion_factor: float = Field(description="Number to convert from input unit to standard_unit")
    category: Category = Field(description="Ingredient category")
    serving_size: float = Field(description="Typical serving size in standard units")

class ReceiptItem(BaseModel):
    """Response model for receipt item extraction"""
    name: str = Field(description="Original product name")
    quantity: float = Field(description="Converted quantity in standard units")
    unit: str = Field(description="grams|milliliters|units|pinch")
    category: Category = Field(description="Item category")
    notes: Optional[str] = Field(None, description="Brand info or other details")

