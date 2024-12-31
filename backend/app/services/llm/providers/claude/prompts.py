import json
from string import Template
from typing import Type, TypeVar

from pydantic import BaseModel

T = TypeVar("T", bound=BaseModel)

MODEL = "claude-3-5-sonnet-20241022"
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
In notes add an icon to indicate the type of ingredient
just reply with the json object
"""

INGREDIENT_ANALYSIS_PROMPT_TEMPLATE = Template(INGREDIENT_ANALYSIS_PROMPT)

RECIPE_GENERATION_PROMPT = """
Generate recipes based on these requirements and available ingredients.
Feel free to generate international recipes. 
And be liberal with using non-english names.
Return recipes that exactly match this schema:

<model>
$model
</model>

<ingredients>   
Available Ingredients:
$ingredients
</ingredients>

<preferences>
Preferences:
$preferences
</preferences>

Important:
- Make good recipes, should be balanced, nutritious, and delicious
- Include detailed step-by-step instructions, each step should have sufficient detail
- Ensure quantities and units are specific and measurable
- Assume a few common ingredients (such as salt, pepper, oil, spices) are available
- Add an icon to each step to indicate the type of step
- When asked for multiple recipes, 
return a couple totally doable with the ingredients in the pantry 
but atleast one that requires 1 or 2 ingredients user may not have
"""

RECIPE_GENERATION_PROMPT_TEMPLATE = Template(RECIPE_GENERATION_PROMPT)
