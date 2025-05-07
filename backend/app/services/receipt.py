import logging
import json
import os
import base64
from functools import lru_cache
from uuid import UUID

from fastapi import UploadFile
from google.cloud import vision
from google.oauth2 import service_account

from ..models.pantry import ListOfPantryItemsCreate
from .llm.providers.claude import ClaudeService

logger = logging.getLogger(__name__)


class ReceiptParser:
    def __init__(self):
        self.claude_service = ClaudeService()
        self._vision_client = None  # Initialize as None

    @property
    def vision_client(self):
        """Lazy initialization of vision client with proper credentials"""
        if self._vision_client is None:
            try:
                # Get base64 encoded credentials from environment variable
                creds_base64 = os.getenv('GOOGLE_APPLICATION_CREDENTIALS_BASE64')
                if creds_base64:
                    # Decode base64 to JSON string
                    creds_json = base64.b64decode(creds_base64).decode('utf-8')
                    # Parse the JSON string into a dictionary
                    creds_dict = json.loads(creds_json)
                    # Create credentials object
                    credentials = service_account.Credentials.from_service_account_info(creds_dict)
                    # Create the client with credentials
                    self._vision_client = vision.ImageAnnotatorClient(credentials=credentials)
                else:
                    # Fallback to default credentials (not recommended)
                    logger.warning("No explicit credentials found, falling back to default credentials")
                    self._vision_client = vision.ImageAnnotatorClient()
            except Exception as e:
                logger.error(f"Error initializing Vision client: {str(e)}")
                raise ValueError(f"Failed to initialize Vision client: {str(e)}")
        return self._vision_client

    async def parse_receipt(
        self, file: UploadFile, user_id: UUID
    ) -> ListOfPantryItemsCreate:
        try:
            content = await file.read()
            image = vision.Image(content=content)

            # Use the property to get the client
            response = self.vision_client.text_detection(image=image)
            texts = response.text_annotations

            if not texts:
                logger.warning("No text detected in receipt image")
                return ListOfPantryItemsCreate(items=[])

            receipt_text = texts[0].description
            logger.debug(f"Extracted receipt text: {receipt_text}")

            try:
                items_data = await self.claude_service.parse_receipt_text(
                    ListOfPantryItemsCreate, receipt_text
                )
                return items_data
            except Exception as e:
                logger.error(f"Claude service failed to parse receipt text: {str(e)}")
                logger.error(f"Receipt text that caused error: {receipt_text}")
                raise ValueError(f"Failed to process receipt text: {str(e)}")

        except Exception as e:
            logger.error(f"Error in parse_receipt: {str(e)}")
            raise ValueError(f"Failed to process receipt: {str(e)}")
