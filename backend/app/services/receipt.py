import logging
from functools import lru_cache
from uuid import UUID

from fastapi import UploadFile
from google.cloud import vision

from ..models.pantry import ListOfPantryItemsCreate
from .claude import ClaudeService

logger = logging.getLogger(__name__)


class ReceiptParser:
    def __init__(self):
        self.claude_service = ClaudeService()
        self._vision_client = None  # Initialize as None

    @property
    def vision_client(self):
        """Lazy initialization of vision client"""
        if self._vision_client is None:
            self._vision_client = vision.ImageAnnotatorClient()
        return self._vision_client

    @lru_cache(maxsize=10)
    async def parse_receipt(
        self, file: UploadFile, user_id: UUID
    ) -> ListOfPantryItemsCreate:
        content = await file.read()
        image = vision.Image(content=content)

        # Use the property to get the client
        response = self.vision_client.text_detection(image=image)
        texts = response.text_annotations

        if not texts:
            return ListOfPantryItemsCreate(items=[])

        receipt_text = texts[0].description

        items_data = await self.claude_service.parse_receipt_text(
            ListOfPantryItemsCreate, receipt_text
        )
        return items_data
