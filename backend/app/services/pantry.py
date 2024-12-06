import uuid
from datetime import datetime
from typing import List, Optional

from ..models.pantry import PantryItem, PantryItemCreate

class PantryManager:
    def __init__(self):
        self._items = {}

    def add_item(self, item: PantryItemCreate) -> PantryItem:
        pantry_item = PantryItem(
            id=str(uuid.uuid4()),
            added_date=datetime.now(),
            name=item.name,
            quantity=item.quantity,
            unit=item.unit,
            category=item.category,
            expiry_date=item.expiry_date,
            notes=item.notes
        )
        self._items[pantry_item.id] = pantry_item
        return pantry_item

    def get_items(self) -> List[PantryItem]:
        return list(self._items.values())

    def get_item(self, item_id: str) -> Optional[PantryItem]:
        return self._items.get(item_id)

    def update_item(self, item_id: str, update_data: dict) -> Optional[PantryItem]:
        if item_id not in self._items:
            return None
        item = self._items[item_id]
        for field, value in update_data.items():
            setattr(item, field, value)
        return item

    def delete_item(self, item_id: str) -> bool:
        if item_id not in self._items:
            return False
        del self._items[item_id]
        return True

    def clear(self):
        self._items.clear()

# Create a single instance at module level
_pantry_manager = PantryManager()

# Add a getter function to access the shared instance
def get_pantry_manager():
    return _pantry_manager
