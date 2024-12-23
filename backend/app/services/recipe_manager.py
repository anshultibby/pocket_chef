import logging
from typing import Dict, List
from uuid import UUID

from ..db.crud import RecipeCRUD
from ..models.pantry import Nutrition
from ..models.recipes import RecipeCreate, RecipeResponse
from .claude import ClaudeService
from .pantry import get_pantry_manager

logger = logging.getLogger(__name__)


class RecipeManager:
    """
    Manages recipe-related operations including generation, nutrition analysis,
    and availability checking.
    """

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
        claude_service = ClaudeService()
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
        pantry_items = await self.pantry_manager.get_items(user_id)

        missing = []
        available = {}

        for ingredient in recipe.data.ingredients:
            pantry_item = next(
                (item for item in pantry_items if item.id == ingredient.pantry_item_id),
                None,
            )

            # Convert quantities to standard units for comparison
            if pantry_item:
                # Get conversion factors from pantry item's unit to recipe's unit
                conversion_factor = await self._get_unit_conversion_factor(
                    pantry_item.data.unit,
                    ingredient.unit,
                    pantry_item.nutrition.standard_unit,
                )

                available_qty = pantry_item.data.quantity * conversion_factor
                needed_qty = ingredient.quantity

                if available_qty < needed_qty:
                    missing.append(ingredient.pantry_item_id)
                else:
                    available[ingredient.pantry_item_id] = available_qty
            else:
                missing.append(ingredient.pantry_item_id)

        return {
            "can_cook": len(missing) == 0,
            "missing_ingredients": missing,
            "available_quantities": available,
        }

    async def analyze_recipe_nutrition(
        self, recipe: RecipeCreate
    ) -> Dict[str, Nutrition]:
        total = Nutrition()
        per_serving = Nutrition()

        for ingredient in recipe.data.ingredients:
            pantry_item = await self.pantry_manager.get_item(ingredient.pantry_item_id)
            if not pantry_item:
                logger.warning(f"Pantry item {ingredient.pantry_item_id} not found")
                continue

            # Convert ingredient quantity to standard units
            conversion_factor = await self._get_unit_conversion_factor(
                ingredient.unit,
                pantry_item.nutrition.standard_unit,
                pantry_item.nutrition.standard_unit,
            )
            standardized_qty = ingredient.quantity * conversion_factor

            # Update total nutrition
            total.calories += pantry_item.nutrition.calories * standardized_qty
            total.protein += pantry_item.nutrition.protein * standardized_qty
            total.carbs += pantry_item.nutrition.carbs * standardized_qty
            total.fat += pantry_item.nutrition.fat * standardized_qty
            total.fiber += pantry_item.nutrition.fiber * standardized_qty

        # Calculate per serving
        servings = recipe.data.servings
        per_serving.calories = total.calories / servings
        per_serving.protein = total.protein / servings
        per_serving.carbs = total.carbs / servings
        per_serving.fat = total.fat / servings
        per_serving.fiber = total.fiber / servings

        return {"total": total, "per_serving": per_serving}

    async def _get_unit_conversion_factor(
        self, from_unit: str, to_unit: str, standard_unit: str
    ) -> float:
        """
        Get conversion factor between units using Claude service.
        Returns a float representing how many of to_unit are in one from_unit.
        """
        # If units are the same, return 1
        if from_unit == to_unit:
            return 1.0

        try:
            # Ask Claude for conversion factor
            prompt = f"""What is the conversion factor from {from_unit} to {to_unit} 
            for measuring ingredients? Express as a single number representing how many 
            {to_unit} are in one {from_unit}. The standard unit is {standard_unit}."""

            response = await self.claude.get_conversion_factor(prompt)
            return float(response)
        except Exception as e:
            logger.error(f"Error getting conversion factor: {str(e)}")
            # Return 1 as fallback to avoid breaking calculations
            return 1.0
