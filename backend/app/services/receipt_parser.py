from fastapi import UploadFile
from ..models.pantry import PantryItemCreate
from typing import List
import uuid
from datetime import datetime
from .claude_service import ClaudeService

class ReceiptParser:
    def __init__(self):
        self.claude_service = ClaudeService()

    async def parse_receipt(self, file: UploadFile) -> List[PantryItemCreate]:
        # Extract text from receipt using Claude Vision
        text = await self.claude_service.extract_text(file)
        
        # Parse items using Claude
        items_prompt = """Extract grocery items from this receipt. For each item include:
        - name (product name)
        - quantity (numeric)
        - unit (e.g., pieces, kg, g)
        - category (produce, dairy, meat, etc.)
        
        Format as JSON array."""
        
        items_data = await self.claude_service.parse_items(text, items_prompt)
        
        # Convert to PantryItemCreate objects
        return [
            PantryItemCreate(
                name=item["name"],
                quantity=item["quantity"],
                unit=item["unit"],
                category=item.get("category"),
                added_date=datetime.now()
            )
            for item in items_data
        ]
