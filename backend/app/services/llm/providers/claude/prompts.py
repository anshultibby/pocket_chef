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


- Use your best guess for nutritional information 
- make sure to use the standard unit for scaling the nutritional information
- In notes add an icon to indicate the type of ingredient
- fill in the expiration date, assume standard shelf life todays date is $today
- just reply with the json object
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
- Make good recipes, should be balanced, nutritious, and delicious. 
- Include a variety of recipes so that user has a good selection, try to return num_recipes requested
- Cross-check nutritional information on recipe to that on ingredients and be consistent
- Include detailed step-by-step instructions, each step should have sufficient detail
- Assume a few common ingredients (such as salt, pepper, oil, basic spices) are available, 
- If you mention any other ingredients in instructions, you should include them in ingredients list
- Add an icon to each step to indicate the type of step
- Try fill in the protein, calories for each ingredient
- Always try to fill in the price, estimate if ingredients are not available
"""

RECIPE_GENERATION_PROMPT_TEMPLATE = Template(RECIPE_GENERATION_PROMPT)
