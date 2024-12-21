import json
import logging
from typing import Dict, List, Optional
from uuid import UUID

from fastapi import UploadFile

from ..db.crud import IngredientCRUD, PantryCRUD

# Local imports
from ..models.pantry import (
    Ingredient,
    IngredientData,
    PantryItem,
    PantryItemCreate,
    PantryItemUpdate,
)
from .claude.service import ClaudeService
from .receipt import ReceiptParser

logger = logging.getLogger(__name__)


class PantryManager:
    def __init__(self):
        self.claude = ClaudeService()
        self.ingredients = IngredientCRUD()
        self.pantry = PantryCRUD()
        self.receipt_parser = ReceiptParser()

    async def add_single_item(
        self, item: PantryItemCreate, user_id: UUID
    ) -> PantryItem:
        """Add a single item to pantry with ingredient standardization"""
        try:
            input_text = (
                f"{item.data.quantity} {item.data.unit} {item.data.display_name}"
            )
            normalized = self.claude.analyze_ingredient(input_text)
            norm_data = json.loads(normalized)

            # Create or get ingredient
            ingredient_data = IngredientData(
                names={
                    "canonical": norm_data["canonical_name"],
                    "aliases": [item.data.display_name],
                },
                measurement={
                    "standard_unit": norm_data["standard_unit"],
                    "conversion_factor": norm_data["conversion_factor"],
                    "serving_size": norm_data["serving_size"],
                },
                category=norm_data["category"],
            )

            ingredient = await self.ingredients.create_or_get(ingredient_data)

            # Create pantry item
            return await self.pantry.create_item(
                user_id=user_id, item=item, ingredient_id=ingredient.id
            )

        except Exception as e:
            logger.error(f"Error adding single item: {str(e)}")
            raise ValueError(f"Failed to add item: {str(e)}")

    async def add_receipt_items(
        self, file: UploadFile, user_id: UUID
    ) -> List[PantryItem]:
        """Process receipt and add items to pantry"""
        try:
            # Extract items from receipt using ReceiptParser
            items = await self.receipt_parser.parse_receipt(file, user_id)

            added_items = []
            for item in items:
                try:
                    added_item = await self.add_single_item(item, user_id)
                    added_items.append(added_item)
                except Exception as e:
                    logger.error(f"Error adding receipt item {item.name}: {str(e)}")
                    continue

            return added_items

        except Exception as e:
            logger.error(f"Error processing receipt: {str(e)}")
            raise ValueError(f"Failed to process receipt: {str(e)}")

    async def get_items(self, user_id: UUID) -> List[PantryItem]:
        try:
            logger.info(f"Getting items for user {user_id}")
            return await self.pantry.get_items(user_id)
        except Exception as e:
            logger.error(f"Error in get_items: {str(e)}")
            raise ValueError(f"Failed to get pantry items: {str(e)}")

    def get_item(self, item_id: str, user_id: UUID) -> Optional[PantryItem]:
        try:
            return self.pantry.get_item(item_id, user_id)
        except Exception as e:
            logger.error(f"Error in get_item: {str(e)}")
            raise ValueError(f"Failed to get pantry item: {str(e)}")

    async def update_item(self, item_id: UUID, updates: PantryItemUpdate) -> PantryItem:
        """Update pantry item with validation and data processing"""
        try:
            # Get current item to ensure it exists and handle merging
            current_item = await self.pantry.get_item(item_id)
            if not current_item:
                raise ValueError(f"Item {item_id} not found")

            # Validate and process updates
            processed_updates = self._process_updates(current_item, updates)

            # Update in database
            updated_item = await self.pantry.update_item(item_id, processed_updates)

            # Fetch fresh item with all relations
            return await self.pantry.get_item_with_relations(item_id)

        except Exception as e:
            logger.error(f"Error updating item {item_id}: {str(e)}")
            raise ValueError(f"Failed to update item: {str(e)}")

    def _process_updates(
        self, current_item: PantryItem, updates: PantryItemUpdate
    ) -> PantryItemUpdate:
        """Process and validate updates before applying them"""
        processed = updates.copy()

        if updates.data:
            # Merge with existing data
            processed.data = {**current_item.data.dict(), **updates.data.dict()}

            # Validate quantity
            if processed.data.get("quantity") is not None:
                processed.data["quantity"] = max(0, float(processed.data["quantity"]))

            # Format dates
            if processed.data.get("expiry_date"):
                processed.data["expiry_date"] = self._format_date(
                    processed.data["expiry_date"]
                )

        return processed

    def delete_item(self, item_id: str, user_id: UUID) -> bool:
        try:
            return self.pantry.delete_item(item_id, user_id)
        except Exception as e:
            logger.error(f"Error in delete_item: {str(e)}")
            raise ValueError(f"Failed to delete pantry item: {str(e)}")

    def clear_pantry(self, user_id: UUID) -> bool:
        try:
            return self.pantry.clear_pantry(user_id)
        except Exception as e:
            logger.error(f"Error in clear_pantry: {str(e)}")
            raise ValueError(f"Failed to clear pantry: {str(e)}")


# Create a singleton instance
_pantry_manager = PantryManager()


def get_pantry_manager() -> PantryManager:
    return _pantry_manager
