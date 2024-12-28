from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


class CustomBaseModel(BaseModel):
    def __str__(self) -> str:
        """Format the model as a readable string with key fields on separate lines"""

        def format_value(v):
            if isinstance(v, CustomBaseModel):
                return (
                    v.__class__.__name__
                )  # Just return the class name instead of recursing
            elif isinstance(v, datetime):
                return v.isoformat()
            elif isinstance(v, UUID):
                return str(v)
            return v

        # Filter out None values and format each field
        fields = {k: format_value(v) for k, v in self.__dict__.items() if v is not None}

        # For PantryItemCreate/PantryItem, we want to focus on the data fields
        if hasattr(self, "data") and isinstance(self.data, PantryItemData):
            return str(self.data)

        # For PantryItemData, format in a single line
        if isinstance(self, PantryItemData):
            parts = [
                f"name: {fields.get('name', '')}",
                f"quantity: {fields.get('quantity', '')}",
                f"unit: {fields.get('unit', '')}",
            ]
            if "category" in fields:
                parts.append(f"category: {fields['category']}")
            if "expiry_date" in fields:
                parts.append(f"expiry: {fields['expiry_date']}")
            if "notes" in fields:
                parts.append(f"notes: {fields['notes']}")
            return " ".join(parts)

        return " ".join(f"{k}: {v}" for k, v in fields.items())


class Nutrition(CustomBaseModel):
    standard_unit: str = Field(
        default="100 grams",
        description="standard unit for scaling the nutritional information",
    )
    calories: float = Field(default=0, description="calories per standard unit")
    protein: float = Field(default=0, description="protein per standard unit")
    carbs: float = Field(default=0, description="carbs per standard unit")
    fat: float = Field(default=0, description="fat per standard unit")
    fiber: float = Field(default=0, description="fiber per standard unit")


class PantryItemData(CustomBaseModel):
    name: str = Field(
        description="common name of the ingredient, this should be simple (for example, 'bread' instead of 'sourdough bread')"
    )
    original_name: Optional[str] = Field(
        description="name of the ingredient as it appears on the receipt or user input"
    )
    quantity: float = Field(
        default=1.0,
        description="quantity of the ingredient",
        ge=0,
        multiple_of=0.01,
    )
    unit: str = Field(default="unit", description="unit of the ingredient")
    category: Optional[str] = Field(description="category of the ingredient")
    notes: Optional[str] = Field(description="notes about the ingredient")
    expiry_date: Optional[str] = Field(
        default=None, description="expiry date of the ingredient in YYYY-MM-DD format"
    )
    price: Optional[float] = Field(description="price per unit")


class PantryItem(CustomBaseModel):
    id: UUID
    data: PantryItemData
    nutrition: Nutrition = Field(
        default_factory=Nutrition,
        description="Nutrition information, may be empty if not yet enriched",
    )
    user_id: UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PantryItemCreate(CustomBaseModel):
    data: PantryItemData
    nutrition: Nutrition = Field(
        default_factory=Nutrition,
        description="Nutrition information for the item, \
            if it cannot be determined then the item may not \
            be a food and you should exclude it",
    )


class ListOfPantryItemsCreate(CustomBaseModel):
    items: List[PantryItemCreate]


class PantryItemUpdate(CustomBaseModel):
    data: Optional[PantryItemData] = None
    nutrition: Optional[Nutrition] = None
