import logging
from typing import Dict, List
from uuid import UUID

from ..db.crud import RecipeCRUD
from ..models.pantry import NutritionalInfo
from ..models.recipes import RecipeCreate, RecipeResponse
from .claude import ClaudeService
from .pantry import get_pantry_manager

logger = logging.getLogger(__name__)


class RecipeManager:
    def __init__(self, claude_service: ClaudeService):
        self.claude = claude_service
        self.recipe_crud = RecipeCRUD()
        self.pantry_manager = get_pantry_manager()


# Create a singleton instance
_recipe_manager = None


def get_recipe_manager() -> RecipeManager:
    """
    Returns a singleton instance of RecipeManager.
    Initializes the instance if it doesn't exist.
    """
    global _recipe_manager
    if _recipe_manager is None:
        claude_service = ClaudeService()  # Create ClaudeService instance
        _recipe_manager = RecipeManager(claude_service)
    return _recipe_manager

    async def generate_recipes_for_categories(
        self, user_id: UUID, categories_to_generate: List[Dict], ingredients: List[str]
    ) -> List[RecipeResponse]:
        recipes = []

        for category in categories_to_generate:
            prompt = self._build_recipe_prompt(
                category=category["category"],
                count=category["count"],
                ingredients=ingredients,
            )

            raw_response = await self.claude.generate_recipes(prompt)
            recipe_creates = self.parse_recipe_response(raw_response)

            # Analyze nutritional info for each recipe
            for recipe in recipe_creates:
                nutrition = await self.analyze_recipe_nutrition(recipe)
                recipe.data.calculated_nutrition = nutrition

            stored_recipes = await self.recipe_crud.create_recipes(
                recipes=recipe_creates, user_id=user_id
            )
            recipes.extend(stored_recipes)

        return recipes

    async def check_recipe_availability(
        self, recipe_id: UUID, user_id: UUID
    ) -> Dict[str, any]:
        recipe = await self.recipe_crud.get_recipe(recipe_id)
        pantry_items = self.pantry_manager.get_items(user_id)

        missing = []
        available = {}

        for ingredient in recipe.data.ingredients:
            pantry_item = next(
                (
                    item
                    for item in pantry_items
                    if item.ingredient_id == ingredient.ingredient_id
                ),
                None,
            )

            if not pantry_item or pantry_item.data.quantity < ingredient.quantity:
                missing.append(ingredient.ingredient_id)
            else:
                available[ingredient.ingredient_id] = pantry_item.data.quantity

        return {
            "can_cook": len(missing) == 0,
            "missing_ingredients": missing,
            "available_quantities": available,
        }

    async def analyze_recipe_nutrition(
        self, recipe: RecipeCreate
    ) -> Dict[str, NutritionalInfo]:
        total = NutritionalInfo()
        per_serving = NutritionalInfo()

        for ingredient in recipe.data.ingredients:
            ingredient_data = await self.recipe_crud.get_ingredient_nutrition(
                ingredient.ingredient_id
            )
            factor = ingredient.quantity / ingredient_data.measurement.serving_size

            # Update total nutrition
            total.calories += (
                ingredient_data.nutrition.per_standard_unit.calories * factor
            )
            total.protein += (
                ingredient_data.nutrition.per_standard_unit.protein * factor
            )
            total.carbs += ingredient_data.nutrition.per_standard_unit.carbs * factor
            total.fat += ingredient_data.nutrition.per_standard_unit.fat * factor
            total.fiber += ingredient_data.nutrition.per_standard_unit.fiber * factor

        # Calculate per serving
        servings = recipe.data.servings
        per_serving.calories = total.calories / servings
        per_serving.protein = total.protein / servings
        per_serving.carbs = total.carbs / servings
        per_serving.fat = total.fat / servings
        per_serving.fiber = total.fiber / servings

        return {"total": total, "per_serving": per_serving}

    # ... rest of helper methods ...
