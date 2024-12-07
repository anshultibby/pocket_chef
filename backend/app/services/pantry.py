from typing import List, Optional

from db.supabase import get_supabase

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate


class PantryManager:
    def __init__(self):
        self.table = "pantry_items"

    def add_item(self, item: PantryItemCreate) -> PantryItem:
        supabase = get_supabase()
        data = item.model_dump(mode="json")
        table = supabase.table(self.table)
        result = table.insert(data).execute()
        return PantryItem(**result.data[0])

    def get_items(self) -> List[PantryItem]:
        supabase = get_supabase()
        result = supabase.table(self.table).select("*").execute()
        return [PantryItem(**item) for item in result.data]

    def get_item(self, item_id: str) -> Optional[PantryItem]:
        supabase = get_supabase()
        result = supabase.table(self.table).select("*").eq("id", item_id).execute()
        return PantryItem(**result.data[0]) if result.data else None

    def update_item(self, item_id: str, update_data: PantryItemUpdate) -> Optional[PantryItem]:
        supabase = get_supabase()
        data = update_data.model_dump(exclude_unset=True)
        result = supabase.table(self.table).update(data).eq("id", item_id).execute()
        return PantryItem(**result.data[0]) if result.data else None

    def delete_item(self, item_id: str) -> bool:
        supabase = get_supabase()
        # First verify the item exists
        existing = supabase.table(self.table).select("*").eq("id", item_id).execute()
        if not existing.data:
            return False
        
        # Then delete it
        result = supabase.table(self.table).delete().eq("id", item_id).execute()
        return len(result.data) > 0  # Return True if we deleted something

# Create a singleton instance
_pantry_manager = PantryManager()

def get_pantry_manager() -> PantryManager:
    return _pantry_manager
