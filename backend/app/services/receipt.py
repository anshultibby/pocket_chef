import io
from datetime import datetime
from typing import List
from uuid import UUID

from fastapi import UploadFile
from google.cloud import vision

from ..models.pantry import PantryItem, PantryItemCreate
from .claude import ClaudeService


class ReceiptParser:
    def __init__(self):
        self.claude_service = ClaudeService()
        self.vision_client = vision.ImageAnnotatorClient()

    async def parse_receipt(
        self, file: UploadFile, user_id: UUID
    ) -> List[PantryItemCreate]:
        content = await file.read()
        image = vision.Image(content=content)
        response = self.vision_client.text_detection(image=image)
        texts = response.text_annotations

        if not texts:
            return []

        receipt_text = texts[0].description

        items_data = await self.claude_service.parse_receipt_text(receipt_text)

        return [
            PantryItemCreate(
                name=item.name,
                quantity=float(item.quantity),
                unit=item.unit,
                category=item.category,
                notes=item.notes,
                expiry_date=item.expiry_date,
                user_id=user_id,
            )
            for item in items_data
        ]
