from typing import List, Optional
from uuid import UUID
import logging
import os
from supabase import Client, create_client

from db.supabase import get_supabase

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate

logger = logging.getLogger(__name__)

class PantryManager:
    def __init__(self):
        self.table = "pantry_items"

    def add_item(self, item: PantryItemCreate, user_id: UUID, auth_token: str) -> PantryItem:
        supabase = get_supabase(auth_token)
        data = {
            **item.model_dump(exclude={'user_id'}, mode="json"),
            "user_id": str(user_id)
        }
        
        logger.info(f"Adding pantry item for user {user_id}")
        
        try:
            result = supabase.table(self.table).insert(data).execute()
            if not result.data:
                raise ValueError("No data returned from insert operation")
            return PantryItem(**result.data[0])
            
        except Exception as e:
            logger.error(f"Failed to add pantry item: {str(e)}")
            raise ValueError(f"Failed to add pantry item: {str(e)}")

    def get_items(self, user_id: UUID, auth_token: str) -> List[PantryItem]:
        supabase = get_supabase(auth_token)
        result = supabase.table(self.table)\
            .eq("user_id", str(user_id))\
            .execute()
        return [PantryItem(**item) for item in result.data]
    def get_item(self, item_id: str, auth_token: str) -> Optional[PantryItem]:
        supabase = get_supabase(auth_token)
        result = supabase.table(self.table).select("*").eq("id", item_id).execute()
        return PantryItem(**result.data[0]) if result.data else None

    def update_item(self, item_id: str, update_data: PantryItemUpdate, auth_token: str) -> Optional[PantryItem]:
        supabase = get_supabase(auth_token)
        data = update_data.model_dump(exclude_unset=True)
        result = supabase.table(self.table).update(data).eq("id", item_id).execute()
        return PantryItem(**result.data[0]) if result.data else None

    def delete_item(self, item_id: str, auth_token: str) -> bool:
        supabase = get_supabase(auth_token)
        existing = supabase.table(self.table).select("*").eq("id", item_id).execute()
        if not existing.data:
            return False
        
        result = supabase.table(self.table).delete().eq("id", item_id).execute()
        return len(result.data) > 0

    def clear_pantry(self, user_id: UUID, auth_token: str) -> bool:
        supabase = get_supabase(auth_token)
        result = supabase.table(self.table).delete().eq("user_id", str(user_id)).execute()
        return len(result.data) > 0

# Create a singleton instance
_pantry_manager = PantryManager()

def get_pantry_manager() -> PantryManager:
    return _pantry_manager

