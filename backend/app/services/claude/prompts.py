import json
from string import Template
from typing import Type, TypeVar

from pydantic import BaseModel

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


INGREDIENT_ANALYSIS_PROMPT = """

Format the following ingredients that may have come from user input or an OCR scan
Into standard format as specified in the model below:

<model>
$model
</model>

Here are the ingredients to format:
<ingredients>
$ingredients
</ingredients>

Use your best guess for nutritional information 
and make sure to use the standard unit for scaling the nutritional information
"""

INGREDIENT_ANALYSIS_PROMPT_TEMPLATE = Template(INGREDIENT_ANALYSIS_PROMPT)
