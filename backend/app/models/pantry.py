from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class MeasurementUnit(str, Enum):
    GRAMS = "grams"
    MILLILITERS = "milliliters"
    UNITS = "units"
    PINCH = "pinch"


class NutritionalInfo(BaseModel):
    calories: float = 0
    protein: float = 0
    carbs: float = 0
    fat: float = 0
    fiber: float = 0


class IngredientMeasurement(BaseModel):
    standard_unit: MeasurementUnit
    conversion_factor: float = 1.0
    serving_size: float = 1


class IngredientNames(BaseModel):
    canonical: str
    aliases: List[str] = []


class IngredientData(BaseModel):
    names: IngredientNames
    measurement: IngredientMeasurement
    nutrition: Dict[str, NutritionalInfo] = Field(
        default_factory=lambda: {"per_standard_unit": NutritionalInfo()}
    )


class Ingredient(BaseModel):
    id: UUID
    data: IngredientData
    created_at: datetime


class PantryItemData(BaseModel):
    display_name: str
    quantity: float
    unit: MeasurementUnit
    category: Optional[str] = None
    notes: Optional[str] = None
    expiry_date: Optional[datetime] = None


class PantryItem(BaseModel):
    id: UUID
    ingredient_id: UUID
    data: PantryItemData
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PantryItemCreate(BaseModel):
    display_name: str
    quantity: float
    unit: MeasurementUnit
    notes: Optional[str] = None
    expiry_date: Optional[datetime] = None


class PantryItemUpdate(BaseModel):
    quantity: Optional[float] = None
    unit: Optional[MeasurementUnit] = None
    notes: Optional[str] = None
    expiry_date: Optional[datetime] = None


class PantryItemWithIngredient(BaseModel):
    id: UUID
    ingredient_id: UUID
    ingredient: IngredientData
    data: PantryItemData
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
