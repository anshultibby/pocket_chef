import base64
import json
import logging
from typing import Dict, Generic, List, Optional, Type, TypeVar, Union

from anthropic import Anthropic
from fastapi import UploadFile
from pydantic import BaseModel

from ...models.pantry import IngredientData, PantryItemCreate, PantryItemData
from ...models.recipes import RecipeData
from .handlers import StructuredResponse
from .prompts import INGREDIENT_SYSTEM_PROMPT, MAX_TOKENS, MODEL, RECEIPT_PROMPT

T = TypeVar('T', bound=BaseModel)

class ClaudeResponse(Generic[T]):
    data: Union[T, List[T]]
    metadata: Optional[Dict]

class ClaudeService:
    def __init__(self):
        self.anthropic = Anthropic()
        self.logger = logging.getLogger(__name__)

    async def analyze_ingredient(self, ingredients: str) -> IngredientData:
        """Analyze a ingredients and return standardized data"""
        response = await self._process_request(
            f"Analyze these ingredient and create \
standardized versions for them: {ingredients}",
            response_model=IngredientData,
            system_prompt=INGREDIENT_SYSTEM_PROMPT
        )
        return response

    async def extract_receipt_items(self, file: UploadFile) -> List[PantryItemData]:
        """Extract and standardize items from a receipt image"""
        items = await self._process_request(
            prompt=RECEIPT_PROMPT,
            response_model=PantryItemData,
            image_file=file,
        )
        return [PantryItemCreate(**item.model_dump()) for item in items]

    async def generate_recipes(
        self, 
        ingredients: List[str], 
        preferences: Optional[str] = None
    ) -> List[RecipeData]:
        """Generate recipes from available ingredients"""
        ingredients_list = "\n".join(f"- {item}" for item in ingredients)
        prompt = f"""Create recipes using these ingredients:
{ingredients_list}

{preferences if preferences else ''}"""

        return await self._process_request(
            prompt=prompt,
            response_model=RecipeData,
        )

    async def _process_request(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        image_file: Optional[UploadFile] = None,
    ) -> Union[T, List[T]]:
        """Process a request to Claude and return structured data"""
        try:
            messages = [{"role": "user", "content": [{"type": "text", "text": prompt}]}]
            
            if image_file:
                messages[0]["content"].append(await self._prepare_image(image_file))

            response = await self._send_request(messages, system_prompt)
            return self._parse_response(response, response_model)
            
        except Exception as e:
            self.logger.error(f"Request failed: {str(e)}")
            raise

    async def _prepare_image(self, image_file: UploadFile) -> dict:
        """Prepare image for Claude API"""
        await image_file.seek(0)
        contents = await image_file.read()
        
        if not contents:
            raise ValueError("Empty image file")
            
        return {
            "type": "image",
            "source": {
                "type": "base64",
                "media_type": image_file.content_type or "image/jpeg",
                "data": base64.b64encode(contents).decode('utf-8')
            }
        }

    async def _send_request(
        self, 
        messages: list, 
        system_prompt: Optional[str]
    ) -> str:
        """Send request to Claude API"""
        params = {
            "model": MODEL,
            "max_tokens": MAX_TOKENS,
            "messages": messages,
        }
        if system_prompt:
            params["system"] = system_prompt

        response = self.anthropic.messages.create(**params)
        return response.content[0].text

    def _parse_response(
        self, 
        content: str, 
        model: Type[T], 
    ) -> Union[T, List[T]]:
        """Parse and validate Claude's response"""
        try:
            handler = StructuredResponse(model)
            return handler.parse(content)
            
        except Exception as e:
            self.logger.error(f"Failed to parse response: {str(e)}")
            self.logger.debug(f"Raw content: {content}")
            raise
