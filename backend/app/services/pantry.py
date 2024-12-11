import logging
import os
from typing import List, Optional
from uuid import UUID

from db.supabase import get_supabase
from supabase import Client, create_client

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate

logger = logging.getLogger(__name__)

class PantryManager:
    def __init__(self):
        self.table = "pantry_items"
        self.supabase = get_supabase()

    def add_item(self, item: PantryItemCreate, user_id: UUID) -> PantryItem:
        try:
            data = {
                **item.model_dump(exclude={'user_id'}, mode="json"),
                "user_id": str(user_id)
            }
            result = self.supabase.table(self.table).insert(data).execute()
            if not result.data:
                raise ValueError("No data returned from insert operation")
            return PantryItem(**result.data[0])
        except Exception as e:
            raise ValueError(f"Failed to add pantry item: {str(e)}")

    def get_items(self, user_id: UUID) -> List[PantryItem]:
        try:
            logger.info(f"Getting items for user {user_id}")
            
            result = self.supabase.table(self.table)\
                .select("*")\
                .eq("user_id", str(user_id))\
                .execute()
            
            return [PantryItem(**item) for item in result.data]
            
        except Exception as e:
            logger.error(f"Error in get_items: {str(e)}")
            raise ValueError(f"Failed to get pantry items: {str(e)}")

    def get_item(self, item_id: str, auth_token: str) -> Optional[PantryItem]:
        supabase = get_supabase(auth_token)
        result = supabase.table(self.table).select("*").eq("id", item_id).execute()
        return PantryItem(**result.data[0]) if result.data else None

    def update_item(self, item_id: str, update_data: PantryItemUpdate, user_id: UUID) -> Optional[PantryItem]:
        data = update_data.model_dump(exclude_unset=True)
        result = self.supabase.table(self.table)\
            .update(data)\
            .eq("id", item_id)\
            .eq("user_id", str(user_id))\
            .execute()
        return PantryItem(**result.data[0]) if result.data else None

    def delete_item(self, item_id: str, user_id: UUID) -> bool:
        result = self.supabase.table(self.table)\
            .delete()\
            .eq("id", item_id)\
            .eq("user_id", str(user_id))\
            .execute()
        return len(result.data) > 0

    def clear_pantry(self, user_id: UUID) -> bool:
        result = self.supabase.table(self.table)\
            .delete()\
            .eq("user_id", str(user_id))\
            .execute()
        return len(result.data) > 0

# Create a singleton instance
_pantry_manager = PantryManager()

def get_pantry_manager() -> PantryManager:
    return _pantry_manager

