import base64
import json
import logging
import os

from anthropic import Anthropic
from fastapi import UploadFile

from ..models.pantry import PantryItem, PantryItemCreate

# Constants
MODEL = "claude-3-5-sonnet-20240620"
MAX_TOKENS = 4096

# Predefined prompts
RECEIPT_PROMPT = """Look at this receipt image and extract all grocery items.
Return ONLY a JSON array where each item has:
- name: product name only (required)
- quantity: numeric amount (required)
- unit: unit of measurement (e.g., pieces, kg, g, lb) (required)
- category: type of food (e.g., produce, dairy, meat, pantry)
- notes: any additional information

Example response:
[
    {
        "name": "Milk",
        "quantity": 1,
        "unit": "gallon",
        "category": "dairy",
        "notes": "organic"
    }
]

Keep responses concise and ensure JSON is complete."""

RECIPE_SYSTEM_PROMPT = "You are a helpful assistant that creates recipes from available ingredients. Return recipes in JSON format."

class ClaudeService:
    def __init__(self):
        self.anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        self.logger = logging.getLogger(__name__)

    async def chat(self, prompt: str, system_prompt: str = None, image_file: UploadFile = None):
        """Generic method to chat with Claude, with optional image support"""
        try:
            messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
            
            # Add image to message if provided
            if image_file:
                # Ensure file pointer is at start
                await image_file.seek(0)
                contents = await image_file.read()
                
                if not contents:
                    raise ValueError("Empty file content")
                    
                base64_image = base64.b64encode(contents).decode('utf-8')
                messages[0]["content"].append({
                    "type": "image",
                    "source": {
                        "type": "base64",
                        "media_type": image_file.content_type or "image/jpeg",
                        "data": base64_image
                    }
                })

            # Create API request parameters
            params = {
                "model": MODEL,
                "max_tokens": MAX_TOKENS,
                "messages": messages,
            }

            # Add system prompt if provided
            if system_prompt:
                params["system"] = [{"role": "system", "content": system_prompt}]

            response = self.anthropic.messages.create(**params)
            
            return self._clean_response(response.content[0].text)
            
        except Exception as e:
            self.logger.error(f"Error in chat: {str(e)}")
            raise

    def _clean_response(self, content: str) -> str:
        """Clean up JSON response from Claude"""
        content = content.replace('\n', ' ').strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        return content.strip()

    # Convenience methods for specific use cases
    async def extract_grocery_items(self, file: UploadFile) -> list[PantryItemCreate]:
        content = await self.chat(
            prompt=RECEIPT_PROMPT,
            image_file=file
        )
        
        try:
            items = json.loads(content)
            validated_items = [
                item for item in items 
                if isinstance(item, dict) and 'name' in item and 'quantity' in item and 'unit' in item
            ]
            return [PantryItemCreate(**item) for item in validated_items]
        except Exception as e:
            self.logger.error(f"Error parsing items: {str(e)}")
            return []

    async def get_recipes(self, prompt: str) -> str:
        return await self.chat(
            prompt=prompt,
            system_prompt=RECIPE_SYSTEM_PROMPT
        )
