import json
from typing import Type, TypeVar

from pydantic import BaseModel

from ...models.pantry import IngredientData, PantryItemData

T = TypeVar("T", bound=BaseModel)

MODEL = "claude-3-5-sonnet-20240620"
MAX_TOKENS = 4096


def create_structured_prompt(model: Type[T], instructions: str = "") -> str:
    """Create a prompt that requests a response matching a Pydantic model"""
    schema = model.model_json_schema()

    prompt = f"""Return a list of JSON that exactly matches this schema:

{json.dumps(schema, indent=2)}

Important requirements:
{instructions}"""

    return prompt


# Pre-defined prompts
INGREDIENT_SYSTEM_PROMPT = create_structured_prompt(
    IngredientData,
    """
- canonical_name must be singular and lowercase
- Use most common measurement unit
- conversion_factor converts input to standard_unit
- category you can pick, it should help us organize ingredients in our pantry
- serving_size should be realistic""",
)

RECEIPT_PROMPT = create_structured_prompt(
    PantryItemData,
    """
I am giving you an image of a receipt. 
Extract all the items from it and return them so i can update the users pantry
Follow the data model provided, additionally:
- Convert all measurements to standard units:
  * oz (liquid) → milliliters
  * oz (solid) → grams
  * lb → grams
  * cups → milliliters
- Use 'units' for countable items
- Round measurements appropriately
- pick sensible category to help user organize their pantry""",
)
