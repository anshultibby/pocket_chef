from typing import List, Dict, Optional
from ..models.recipes import Recipe, NutritionalInfo
import uuid
from .claude_service import ClaudeService

class RecipeGenerator:
    def __init__(self):
        self.claude_service = ClaudeService()

    async def generate_recipes(self, ingredients: List[str], preferences: Optional[Dict[str, str]] = None) -> List[Recipe]:
        # Build a detailed prompt for Claude
        ingredients_text = ", ".join(ingredients)
        
        prompt = f"""Given these ingredients: {ingredients_text}

Generate 3 unique recipes that maximize the use of these ingredients. For each recipe, provide:

1. A creative but practical name
2. A complete list of ingredients with specific quantities (marking which ones are from the provided list)
3. Step-by-step cooking instructions
4. Estimated preparation time
5. Difficulty level (easy/medium/hard)
6. Nutritional information per serving

Format the response as a JSON array with this structure:
{{
    "recipes": [
        {{
            "name": "Recipe Name",
            "ingredients": ["1 cup rice", "2 tbsp olive oil", ...],
            "instructions": ["Step 1...", "Step 2...", ...],
            "preparation_time": "30 minutes",
            "difficulty": "easy",
            "nutritional_info": {{
                "calories": 350,
                "protein": 12,
                "carbs": 45,
                "fat": 14
            }}
        }}
    ]
}}"""

        if preferences:
            dietary_prefs = []
            for key, value in preferences.items():
                if key == "dietary_restrictions" and value:
                    dietary_prefs.append(f"Must be {value}")
                elif key == "cuisine_type" and value:
                    dietary_prefs.append(f"Should be {value} style")
                elif key == "spice_level" and value:
                    dietary_prefs.append(f"Spice level should be {value}")
            
            if dietary_prefs:
                prompt += f"\n\nAdditional requirements:\n" + "\n".join(dietary_prefs)

        try:
            # Get recipe data from Claude
            response_data = await self.claude_service.generate_recipes(prompt)
            
            # Transform the response into Recipe objects
            recipes = []
            for recipe_data in response_data.get("recipes", []):
                nutritional_info = NutritionalInfo(**recipe_data.get("nutritional_info", {
                    "calories": 0,
                    "protein": 0,
                    "carbs": 0,
                    "fat": 0
                }))

                recipe = Recipe(
                    id=str(uuid.uuid4()),
                    name=recipe_data["name"],
                    ingredients=recipe_data["ingredients"],
                    instructions=recipe_data["instructions"],
                    preparation_time=recipe_data.get("preparation_time"),
                    difficulty=recipe_data.get("difficulty", "medium"),
                    nutritional_info=nutritional_info,
                    is_saved=False
                )
                recipes.append(recipe)

            return recipes

        except Exception as e:
            raise Exception(f"Failed to generate recipes: {str(e)}")

    async def analyze_ingredients_usage(self, ingredients: List[str], recipe: Recipe) -> Dict[str, bool]:
        """Analyze which provided ingredients are used in the recipe"""
        used_ingredients = {ingredient.lower(): False for ingredient in ingredients}
        
        for recipe_ingredient in recipe.ingredients:
            for ingredient in ingredients:
                if ingredient.lower() in recipe_ingredient.lower():
                    used_ingredients[ingredient.lower()] = True
        
        return used_ingredients

    async def get_shopping_list(self, recipe: Recipe, pantry_ingredients: List[str]) -> List[str]:
        """Generate a shopping list for missing ingredients"""
        shopping_list = []
        pantry_ingredients_lower = [ing.lower() for ing in pantry_ingredients]
        
        for recipe_ingredient in recipe.ingredients:
            is_in_pantry = any(
                pantry_ing in recipe_ingredient.lower() 
                for pantry_ing in pantry_ingredients_lower
            )
            if not is_in_pantry:
                shopping_list.append(recipe_ingredient)
        
        return shopping_list
