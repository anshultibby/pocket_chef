import base64
import json
import logging
import os
from typing import List, Optional

from anthropic import Anthropic
from fastapi import UploadFile

from ..models.pantry import PantryItemCreate

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

RECIPE_SYSTEM_PROMPT = """You are a helpful assistant that creates recipes from available ingredients. 
Return recipes in JSON format as an array of objects with the following structure:
{
    "name": "Recipe Name",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": ["step 1", "step 2"],
    "preparationTime": "30 minutes",
    "difficulty": "Easy",
    "nutritionalInfo": {
        "calories": 500,
        "protein": 20.5,
        "carbs": 30.5,
        "fat": 15.5
    }
}

Important:
- All fields are required
- nutritionalInfo must always be included with realistic values
- Use camelCase for all field names
- Calories should be whole numbers
- Protein, carbs, and fat should be in grams with up to 1 decimal place"""

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
                params["system"] = system_prompt

            response = self.anthropic.messages.create(**params)
            raw_response = response.content[0].text
            
            self.logger.info(f"Claude raw response: {raw_response}")
            
            cleaned_response = self._clean_response(raw_response)
            self.logger.info(f"Claude cleaned response: {cleaned_response}")
            
            return cleaned_response
            
        except Exception as e:
            self.logger.error(f"Error in chat: {str(e)}")
            raise

    def _clean_response(self, content: str) -> str:
        """Clean up JSON response from Claude by finding the JSON array"""
        try:
            # Find the first array
            start = content.find('[')
            end = content.rfind(']')
            
            if start == -1 or end == -1:
                raise ValueError("No JSON array found in response")
                
            content = content[start:end + 1]
            
            # Validate JSON structure
            json.loads(content)  # Test if parseable
            return content
            
        except Exception as e:
            self.logger.error(f"Error cleaning response: {content}")
            self.logger.error(f"Clean response error details: {str(e)}")
            raise

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

    async def generate_recipes(self, ingredients: List[str], preferences: Optional[str] = None) -> str:
        """Generate recipes based on available ingredients and optional preferences"""
        try:
            # Construct the prompt
            ingredients_list = "\n".join(f"- {item}" for item in ingredients)
            prompt = f"""Create recipes using these ingredients:
{ingredients_list}

{preferences if preferences else ''}

Return recipes that maximize the use of a few available ingredients while being practical and tasty."""

            # Get the raw JSON response from Claude
            return await self.chat(
                prompt=prompt,
                system_prompt=RECIPE_SYSTEM_PROMPT
            )
            
        except Exception as e:
            self.logger.error(f"Error generating recipes: {str(e)}")
            raise ValueError(f"Failed to generate recipes: {str(e)}")
