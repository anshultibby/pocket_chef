from anthropic import Anthropic
import os
from ..models import schemas
import json
import logging
import base64
from fastapi import UploadFile

anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

logger = logging.getLogger(__name__)

# Constants for token limits and configuration
MAX_TOKENS = 4096  # Increased from 1024
CHUNK_SIZE = 2000
MODEL = "claude-3-5-sonnet-20240620"

async def extract_items(file: UploadFile, prompt: str) -> list[schemas.Item]:
    contents = await file.read()
    base64_image = base64.b64encode(contents).decode('utf-8')
    
    response = anthropic.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,  # Increased token limit
        system="You are a helpful assistant that extracts grocery items from receipt images. Always respond with a valid JSON array of items.",
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Look at this receipt image and extract all grocery items.
                        Return ONLY a JSON array where each item has:
                        - name: product name only (required)
                        - price: numeric price (required)
                        - quantity: default to 1
                        - shelf_life_days: estimate (7 for fresh, 90 for packaged, 180 for frozen)
                        
                        Keep responses concise and ensure JSON is complete.
                        Format example:
                        [
                            {
                                "name": "Rice Noodle Mushroom",
                                "price": 0.99,
                                "quantity": 1,
                                "shelf_life_days": 90
                            }
                        ]"""
                    },
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": "image/jpeg",
                            "data": base64_image
                        }
                    }
                ]
            }
        ]
    )
    
    try:
        content = response.content[0].text.strip()
        # Clean up common JSON formatting issues
        content = content.replace('\n', ' ').strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        logger.info(f"Claude response length: {len(content)}")
        
        items = json.loads(content)
        # Validate items before converting
        validated_items = [
            item for item in items 
            if isinstance(item, dict) and 'name' in item and 'price' in item
        ]
        
        return [schemas.Item.from_input(item) for item in validated_items]
    except Exception as e:
        logger.error(f"Error parsing response: {str(e)}")
        logger.error(f"Raw response: {content}")
        return []

async def get_completion(prompt: str) -> str:
    """Generic completion function for getting responses from Claude"""
    try:
        response = anthropic.messages.create(
            model=MODEL,
            max_tokens=MAX_TOKENS,
            system="You are a helpful assistant that creates recipes from available ingredients. Return recipes in JSON format.",
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        content = response.content[0].text.strip()
        
        # Clean up JSON formatting
        content = content.replace('\n', ' ').strip()
        if content.startswith('```json'):
            content = content[7:]
        if content.endswith('```'):
            content = content[:-3]
        content = content.strip()
        
        # Validate JSON by parsing it (will raise exception if invalid)
        json.loads(content)
        
        logger.info(f"Successfully generated response of length: {len(content)}")
        return content
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        logger.error(f"Raw response content: {content}")
        raise
    except Exception as e:
        logger.error(f"Error in get_completion: {str(e)}")
        raise
