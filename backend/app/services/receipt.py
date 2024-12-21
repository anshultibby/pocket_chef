from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import UploadFile

from ..models.pantry import PantryItem, PantryItemCreate
from .claude import ClaudeService


class ReceiptParser:
    def __init__(self):
        self.claude_service = ClaudeService()

    async def parse_receipt(self, file: UploadFile, user_id: UUID) -> List[PantryItemCreate]:
        # Get items directly from Claude service using predefined RECEIPT_PROMPT
        items_data: List[PantryItem] = await self.claude_service.extract_grocery_items(file)
        
        # Convert to PantryItemCreate objects
        return [
            PantryItemCreate(
                name=item.name,
                quantity=float(item.quantity),  # ensure quantity is float
                unit=item.unit,
                category=item.category,
                notes=item.notes,
                expiry_date=item.expiry_date,
                user_id=user_id
            )
            for item in items_data
        ]
