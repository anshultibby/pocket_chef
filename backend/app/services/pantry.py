import logging
from functools import lru_cache
from typing import List, Optional
from uuid import UUID

from fastapi import UploadFile

from ..db.crud import PantryCRUD
from ..models.pantry import (
    ListOfPantryItemsCreate,
    Nutrition,
    PantryItem,
    PantryItemCreate,
    PantryItemData,
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
            partial_item = await self.pantry.create_item(user_id=user_id, item=item)

            # Skip Claude enrichment if nutrition is already provided
            if not item.nutrition or not any(vars(item.nutrition).values()):
                ingredient_text = str(item)
                logger.info(f"Ingredient text: {ingredient_text}")
                enriched_item: PantryItemCreate = (
                    await self.claude.parse_ingredient_text(
                        PantryItemCreate, ingredient_text
                    )
                )
                updates = PantryItemUpdate(
                    data=enriched_item.data,
                    nutrition=enriched_item.nutrition,
                )
                return await self.pantry.update_item(partial_item.id, updates)

            return partial_item

        except Exception as e:
            logger.error(f"Error processing item: {str(e)}")
            logger.exception("Full traceback:")
            raise ValueError(f"Failed to process item: {str(e)}")

    async def add_single_item(
        self, item: PantryItemCreate, user_id: UUID
    ) -> PantryItem:
        """Add a single item to pantry with name standardization"""
        try:
            return await self._process_pantry_item(item, user_id)
        except Exception as e:
            logger.error(f"Error in add_single_item: {str(e)}")
            logger.exception("Full traceback:")
            raise

    @lru_cache(maxsize=10)
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
            current_data = current_item.data.model_dump()
            updates_dict = updates.data.model_dump(exclude_unset=True)
            merged_data = current_data | updates_dict

            # Validate quantity
            if "quantity" in updates_dict:
                merged_data["quantity"] = max(0, float(merged_data["quantity"]))

            processed.data = PantryItemData(**merged_data)

        if updates.nutrition:
            # Create new Nutrition with merged values
            current_nutrition = current_item.nutrition.model_dump()
            updates_dict = updates.nutrition.model_dump(exclude_unset=True)
            merged_nutrition = current_nutrition | updates_dict

            processed.nutrition = Nutrition(**merged_nutrition)

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

    async def subtract_quantity(
        self, user_id: UUID, item_id: UUID, quantity: float
    ) -> PantryItem:
        """Subtract quantity from a pantry item"""
        try:
            item = await self.pantry.get_item(item_id, user_id)
            if not item:
                raise ValueError("Item not found")

            if item.data.quantity < quantity:
                item.data.quantity = 0

            item.data.quantity -= quantity

            if item.data.quantity <= 0:
                await self.pantry.delete_item(item_id, user_id)
                return None

            return await self.pantry.update_item(
                item_id=item_id, updates=PantryItemUpdate(data=item.data)
            )

        except Exception as e:
            logger.error(f"Error subtracting quantity: {str(e)}")
            raise


# Create a singleton instance
_pantry_manager = PantryManager()


def get_pantry_manager() -> PantryManager:
    return _pantry_manager
