from typing import List, Optional

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate
from ..services.supabase import get_supabase


class PantryManager:
    def __init__(self):
        self.table = "pantry_items"

    async def add_item(self, item: PantryItemCreate) -> PantryItem:
        supabase = get_supabase()
        data = item.model_dump()
        result = await supabase.table(self.table).insert(data).execute()
        return PantryItem(**result.data[0])

    async def get_items(self) -> List[PantryItem]:
        supabase = get_supabase()
        result = await supabase.table(self.table).select("*").execute()
        return [PantryItem(**item) for item in result.data]

    async def get_item(self, item_id: str) -> Optional[PantryItem]:
        supabase = get_supabase()
        result = await supabase.table(self.table).select("*").eq("id", item_id).execute()
        return PantryItem(**result.data[0]) if result.data else None

    async def update_item(self, item_id: str, update_data: PantryItemUpdate) -> Optional[PantryItem]:
        supabase = get_supabase()
        data = update_data.model_dump(exclude_unset=True)
        result = await supabase.table(self.table).update(data).eq("id", item_id).execute()
        return PantryItem(**result.data[0]) if result.data else None

    async def delete_item(self, item_id: str) -> bool:
        supabase = get_supabase()
        result = await supabase.table(self.table).delete().eq("id", item_id).execute()
        return bool(result.data)

# Create a singleton instance
_pantry_manager = PantryManager()

def get_pantry_manager() -> PantryManager:
    return _pantry_manager
