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

RECIPE_PANTRY_PROMPT = """
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
- Compare nutritional information on recipe to that on ingredients and be consistent
- Include detailed step-by-step instructions, each step should have sufficient detail
- Ensure quantities and units are specific and measurable
- Assume a few common ingredients (such as salt, pepper, oil, spices) are available
- Add an icon to each step to indicate the type of step
- Try fill in the protein, calories for each ingredient
- Always try to fill in the price, estimate if ingredients are not available
- When asked for multiple recipes, 
return a couple totally doable with the ingredients in the pantry 
but atleast one that requires 1 or 2 ingredients user may not have
"""

RECIPE_PANTRY_PROMPT_TEMPLATE = Template(RECIPE_PANTRY_PROMPT)


RECIPE_SHOPPING_PROMPT = """
You part of an intelligent system which takes in items in a user's pantry
and an api for calling grocery store search and then suggests recipes to the user.

These recipes are fed into the next block which makes calls to grocery api to compute full cost
of the meals and allow user to shop for the missing ingredients.

Your job is to suggest recipes to the user matching their preferences using
a combination of items in their pantry and in the shopping store

You should come up with recipes that use ingredients that user already has. 
For each recipe you can come up with you may encounter one of these two cases:
1. User has sufficient ingredients for a recipe.
2. User may need to buy a few ingredients to be able to cook a recipe.

Both of these cases are ok. We will just return the recipe to the user and mark which ingredients they have 
vs which ones they will need to buy.

The recipes themeselves dont have to be in too much detail, 
we will use a block later to fill in all the details.
You can just focus on writing the name, 
brief instructions on how to cook it
and a list of all ingredients required for the recipe.

Here are currently available ingredients in user pantry:
<ingredients>
$ingredients
</ingredients>

Here are the user preferences for the recipes:
<preferences>
$preferences
</preferences>

Here is the output format you should return your answer in
<model>
$model
</model>

Follow a few guidelines:
1. Make sure recipes are nutritious and delicious. 
2. Make sure you suggest ingredient quantities in units
that can be found when shopping on some online grocery api
"""

RECIPE_SHOPPING_PROMPT_TEMPLATE = Template(RECIPE_SHOPPING_PROMPT)
