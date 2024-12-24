import logging
from typing import List
from uuid import UUID

from fastapi import UploadFile
from google.cloud import vision

from ..models.pantry import ListOfPantryItemsCreate
from .claude import ClaudeService

logger = logging.getLogger(__name__)


class ReceiptParser:
    def __init__(self):
        self.claude_service = ClaudeService()
        self.vision_client = vision.ImageAnnotatorClient()

    async def parse_receipt(
        self, file: UploadFile, user_id: UUID
    ) -> ListOfPantryItemsCreate:
        content = await file.read()
        image = vision.Image(content=content)
        response = self.vision_client.text_detection(image=image)
        texts = response.text_annotations

        if not texts:
            return ListOfPantryItemsCreate(items=[])

        receipt_text = texts[0].description

        items_data = await self.claude_service.parse_receipt_text(
            ListOfPantryItemsCreate, receipt_text
        )
        return items_data
