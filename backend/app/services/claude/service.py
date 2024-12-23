import logging
from typing import Dict, Generic, List, Optional, Type, TypeVar, Union

from anthropic import Anthropic
from pydantic import BaseModel

from ...models.pantry import ListOfPantryItemsCreate, PantryItemCreate
from ...models.recipes import RecipeData
from .handlers import parse_claude_response
from .prompts import INGREDIENT_ANALYSIS_PROMPT_TEMPLATE, MAX_TOKENS, MODEL

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class ClaudeResponse(Generic[T]):
    data: Union[T, List[T]]
    metadata: Optional[Dict]


class ClaudeService:
    def __init__(self):
        self.anthropic = Anthropic()
        self.logger = logging.getLogger(__name__)

    async def parse_ingredient_text(self, ingredient: str) -> PantryItemCreate:
        """Parse and standardize items from receipt text"""
        summary_schema = summarize_schema(PantryItemCreate.model_json_schema())
        prompt = INGREDIENT_ANALYSIS_PROMPT_TEMPLATE.substitute(
            ingredients=ingredient, model=summary_schema
        )
        logger.info(f"Prompt: {prompt}")
        item = await self._process_request(
            prompt=prompt,
            response_model=PantryItemCreate,
            is_text=True,
        )
        return item

    async def parse_receipt_text(self, receipt_text: str) -> ListOfPantryItemsCreate:
        """Parse receipt text and return list of PantryItemCreate"""
        summary_schema = summarize_schema(ListOfPantryItemsCreate.model_json_schema())
        prompt = INGREDIENT_ANALYSIS_PROMPT_TEMPLATE.substitute(
            ingredients=receipt_text, model=summary_schema
        )
        items = await self._process_request(
            prompt=prompt,
            response_model=ListOfPantryItemsCreate,
            is_text=True,
        )
        return items

    async def generate_recipes(
        self, ingredients: List[str], preferences: Optional[str] = None
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
        if "anyOf" in details:
            return " | ".join(t["type"] for t in details["anyOf"])
        elif details.get("type") == "array":
            item_details = details["items"]
            if "$ref" in item_details:
                ref_name = item_details["$ref"].split("/")[-1]
                return f"List[{ref_name}]"
            return f"List[{item_details.get('type', 'any')}]"
        return details.get("type", "")

    def get_ref_schema(ref: str, schema: dict) -> dict:
        ref_name = ref.split("/")[-1]
        return schema["$defs"][ref_name]

    process_properties(schema["properties"])
    return "\n".join(output)
