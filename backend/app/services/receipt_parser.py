from datetime import datetime
from typing import List

from fastapi import UploadFile

from ..models.pantry import PantryItemCreate
from .claude_service import ClaudeService


class ReceiptParser:
    def __init__(self):
        self.claude_service = ClaudeService()

    async def parse_receipt(self, file: UploadFile) -> List[PantryItemCreate]:
        # Get items directly from Claude service using predefined RECEIPT_PROMPT
        items_data = await self.claude_service.extract_grocery_items(file)
        
        # Convert to PantryItemCreate objects
        return [
            PantryItemCreate(
                name=item["name"],
                quantity=float(item["quantity"]),  # ensure quantity is float
                unit=item["unit"],
                category=item.get("category"),
                notes=item.get("notes"),
                added_date=datetime.now()
            )
            for item in items_data
        ]
