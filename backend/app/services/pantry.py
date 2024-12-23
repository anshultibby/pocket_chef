import json
import logging
from typing import List, Optional
from uuid import UUID

from fastapi import UploadFile

from ..db.crud import PantryCRUD
from ..models.pantry import (
    ListOfPantryItemsCreate,
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
        self.pantry = PantryCRUD()
        self.receipt_parser = ReceiptParser()

    async def _process_pantry_item(
        self, item: PantryItemCreate, user_id: UUID
    ) -> PantryItem:
        """Helper method to process and add a single pantry item"""
        try:
            logger.info(f"Processing pantry item data: {item.data}")

            # First store the item as-is with user's partial data
            partial_item = await self.pantry.create_item(user_id=user_id, item=item)
            ingredient_text = str(item)
            logger.info(f"Ingredient text: {ingredient_text}")
            enriched_item: PantryItemCreate = await self.claude.parse_ingredient_text(
                ingredient_text
            )
            updates = PantryItemUpdate(
                data=enriched_item.data,
                nutrition=enriched_item.nutrition,
            )
            return await self.pantry.update_item(partial_item.id, updates)

        except Exception as e:
            logger.error(f"Error processing item: {str(e)}")
            logger.exception("Full traceback:")
            raise ValueError(f"Failed to process item: {str(e)}")

    async def add_single_item(
        self, item: PantryItemCreate, user_id: UUID
    ) -> PantryItem:
        """Add a single item to pantry with name standardization"""
        try:
            logger.info(f"Adding single item: {item}")
            return await self._process_pantry_item(item, user_id)
        except Exception as e:
            logger.error(f"Error in add_single_item: {str(e)}")
            logger.exception("Full traceback:")
            raise

    async def process_receipt(
        self, file: UploadFile, user_id: UUID
    ) -> List[PantryItemCreate]:
        """Process receipt and return suggested items without storing them"""
        try:
            list_of_items: ListOfPantryItemsCreate = (
                await self.receipt_parser.parse_receipt(file, user_id)
            )
            return list_of_items.items
        except Exception as e:
            logger.error(f"Error processing receipt: {str(e)}")
            raise ValueError(f"Failed to process receipt: {str(e)}")

    async def add_receipt_items(
        self, items: List[PantryItemCreate], user_id: UUID
    ) -> List[PantryItem]:
        """Store confirmed receipt items"""
        added_items = []
        for item in items:
            try:
                added_item = await self.pantry.create_item(user_id=user_id, item=item)
                added_items.append(added_item)
            except Exception as e:
                logger.error(f"Error adding receipt item {item}: {str(e)}")
                continue
        return added_items

    async def get_items(self, user_id: UUID) -> List[PantryItem]:
        try:
            logger.info(f"Getting items for user {user_id}")
            return await self.pantry.get_items(user_id)
        except Exception as e:
            logger.error(f"Error in get_items: {str(e)}")
            raise ValueError(f"Failed to get pantry items: {str(e)}")

    async def get_item(self, item_id: UUID, user_id: UUID) -> Optional[PantryItem]:
        """Get a single pantry item"""
        try:
            return await self.pantry.get_item(item_id, user_id)
        except Exception as e:
            logger.error(f"Error in get_item: {str(e)}")
            raise ValueError(f"Failed to get pantry item: {str(e)}")

    async def update_item(
        self, item_id: str, update_data: PantryItemUpdate, user_id: UUID
    ) -> PantryItem:
        """Update pantry item with validation and data processing"""
        try:
            # Get current item to ensure it exists and handle merging
            current_item = await self.pantry.get_item(UUID(item_id))
            if not current_item:
                raise ValueError(f"Item {item_id} not found")

            # Verify user owns the item
            if current_item.user_id != user_id:
                raise ValueError("Unauthorized to update this item")

            # Validate and process updates
            processed_updates = self._process_updates(current_item, update_data)

            # Update in database
            return await self.pantry.update_item(UUID(item_id), processed_updates)

        except ValueError as e:
            logger.error(f"Validation error updating item {item_id}: {str(e)}")
            raise
        except Exception as e:
            logger.error(f"Error updating item {item_id}: {str(e)}")
            raise ValueError(f"Failed to update item: {str(e)}")

    def _process_updates(
        self, current_item: PantryItem, updates: PantryItemUpdate
    ) -> PantryItemUpdate:
        """Process and validate updates before applying them"""
        processed = PantryItemUpdate()

        if updates.data:
            # Create new PantryItemData with merged values
            processed.data = current_item.data.copy()
            processed.data = processed.data.model_dump()
            updates_dict = updates.data.model_dump(exclude_unset=True)
            processed.data.update(updates_dict)

            # Validate quantity
            if "quantity" in updates_dict:
                processed.data["quantity"] = max(0, float(processed.data["quantity"]))

        if updates.nutrition:
            # Create new Nutrition with merged values
            processed.nutrition = current_item.nutrition.copy()
            processed.nutrition = processed.nutrition.model_dump()
            updates_dict = updates.nutrition.model_dump(exclude_unset=True)
            processed.nutrition.update(updates_dict)

        return processed

    async def delete_item(self, item_id: str, user_id: UUID) -> bool:
        """Delete a pantry item"""
        try:
            return await self.pantry.delete_item(UUID(item_id), user_id)
        except Exception as e:
            logger.error(f"Error in delete_item: {str(e)}")
            raise ValueError(f"Failed to delete pantry item: {str(e)}")

    async def clear_pantry(self, user_id: UUID) -> bool:
        try:
            return await self.pantry.clear_pantry(user_id)
        except Exception as e:
            logger.error(f"Error in clear_pantry: {str(e)}")
            raise ValueError(f"Failed to clear pantry: {str(e)}")


# Create a singleton instance
_pantry_manager = PantryManager()


def get_pantry_manager() -> PantryManager:
    return _pantry_manager
