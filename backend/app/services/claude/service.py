import logging
from functools import lru_cache
from typing import Dict, Generic, List, Optional, Type, TypeVar, Union

from anthropic import Anthropic
from pydantic import BaseModel

from ...models.pantry import ListOfPantryItemsCreate, PantryItemCreate
from ...models.recipes import RecipeData
from .handlers import parse_claude_response
from .prompts import (
    INGREDIENT_ANALYSIS_PROMPT_TEMPLATE,
    MAX_TOKENS,
    MODEL,
    RECIPE_GENERATION_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class ClaudeResponse(Generic[T]):
    data: Union[T, List[T]]
    metadata: Optional[Dict]


class ClaudeService:
    def __init__(self):
        self.anthropic = Anthropic()
        self.logger = logging.getLogger(__name__)

    @lru_cache(maxsize=1000)
    async def parse_ingredient_text(self, model: Type[T], ingredient: str) -> T:
        """Parse and standardize items from receipt text"""
        summary_schema = summarize_schema(model.model_json_schema())
        prompt = INGREDIENT_ANALYSIS_PROMPT_TEMPLATE.substitute(
            ingredients=ingredient, model=summary_schema
        )
        item = await self._process_request(
            prompt=prompt,
            response_model=model,
            is_text=True,
        )
        return item

    async def parse_receipt_text(self, model: Type[T], receipt_text: str) -> T:
        """Parse receipt text and return list of PantryItemCreate"""
        summary_schema = summarize_schema(model.model_json_schema())
        prompt = INGREDIENT_ANALYSIS_PROMPT_TEMPLATE.substitute(
            ingredients=receipt_text, model=summary_schema
        )
        items = await self._process_request(
            prompt=prompt,
            response_model=model,
            is_text=True,
        )
        return items

    async def generate_recipes(
        self, model: Type[T], ingredients: List[str], preferences: str
    ) -> List[T]:
        """Generate recipes using structured prompt"""
        model_text = summarize_schema(model.model_json_schema())
        ingredients_text = "\n".join(f"- {item}" for item in ingredients)
        prompt = RECIPE_GENERATION_PROMPT_TEMPLATE.substitute(
            model=model_text,
            ingredients=ingredients_text,
            preferences=preferences,
        )
        logger.info(f"Prompt: {prompt}")
        return await self._process_request(
            prompt=prompt,
            response_model=model,
            system_prompt="You are a culinary expert. Generate creative, practical recipes that exactly match the schema.",
        )

    async def _process_request(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        is_text: bool = False,
    ) -> Union[T, List[T]]:
        """Process a request to Claude and return structured data"""
        try:
            if is_text:
                messages = [
                    {"role": "user", "content": [{"type": "text", "text": prompt}]}
                ]
            else:
                messages = [{"role": "user", "content": prompt}]
            response = await self._send_request(messages, system_prompt)
            logger.info(f"Response: {response}")
            extracted_object = parse_claude_response(response, response_model)
            return extracted_object

        except Exception as e:
            self.logger.error(f"Request failed: {str(e)}")
            raise

    async def _send_request(self, messages: list, system_prompt: Optional[str]) -> str:
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


def summarize_schema(schema: dict) -> str:
    """Return a simplified schema in name/type/description format"""
    output = []
    output.append(f"{'Field':<30} {'Type':<20} Description")
    output.append("-" * 80)

    def process_properties(properties: dict, prefix: str = "") -> None:
        for name, details in properties.items():
            field_type = get_field_type(details, schema)
            description = details.get("description", "")
            output.append(f"{prefix}{name:<30} {field_type:<20} {description}")

            # Recursively process nested objects and arrays
            if "$ref" in details:
                ref_schema = get_ref_schema(details["$ref"], schema)
                process_properties(ref_schema["properties"], f"{prefix}{name}.")
            elif details.get("type") == "array" and "items" in details:
                if "$ref" in details["items"]:
                    ref_schema = get_ref_schema(details["items"]["$ref"], schema)
                    process_properties(ref_schema["properties"], f"{prefix}{name}[].")

    def get_field_type(details: dict, schema: dict) -> str:
        """Extract the field type from schema details"""
        if "anyOf" in details:
            # Handle cases where items in anyOf might not have explicit type
            types = []
            for t in details["anyOf"]:
                if "type" in t:
                    types.append(t["type"])
                elif "$ref" in t:
                    # Handle reference types
                    ref_name = t["$ref"].split("/")[-1]
                    types.append(ref_name)
            return " | ".join(types) if types else "any"
        elif "type" in details:
            return details["type"]
        elif "$ref" in details:
            # Handle reference types
            return details["$ref"].split("/")[-1]
        else:
            return "any"

    def get_ref_schema(ref: str, schema: dict) -> dict:
        ref_name = ref.split("/")[-1]
        return schema["$defs"][ref_name]

    process_properties(schema["properties"])
    return "\n".join(output)
