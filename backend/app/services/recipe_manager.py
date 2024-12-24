import logging
from typing import Dict, List, Optional
from uuid import UUID

from ..db.crud import PantryCRUD, RecipeCRUD
from ..models.pantry import PantryItemUpdate
from ..models.recipes import (
    ListOfRecipeData,
    RecipePreferences,
    RecipeResponse,
    RecipeUsage,
    RecipeUsageCreate,
)
from .claude import ClaudeService
from .pantry import get_pantry_manager

logger = logging.getLogger(__name__)


class RecipeManager:
    """
    Manages recipe-related operations including generation, nutrition analysis,
    and availability checking.
    """

    def __init__(self):
        self.claude_service = ClaudeService()
        self.recipe_crud = RecipeCRUD()
        self.pantry_crud = PantryCRUD()

    async def generate_recipe(
        self, preferences: RecipePreferences, user_id: UUID
    ) -> List[RecipeResponse]:
        """Generate recipe and link ingredients to pantry items"""
        pantry_manager = get_pantry_manager()
        pantry_items = await pantry_manager.get_items(user_id)
        final_recipes = []
        ingredients = [
            f"{item.data.name} ({item.data.quantity} {item.data.unit})"
            for item in pantry_items
        ]
        list_of_recipe_data = await self.claude_service.generate_recipes(
            ListOfRecipeData,
            ingredients=ingredients,
            preferences=preferences,
        )
        for recipe_data in list_of_recipe_data.recipes:
            recipe_crud = await self.recipe_crud.create_recipe(
                user_id=user_id,
                data=recipe_data,
            )
            final_recipes.append(recipe_crud)
        return final_recipes

    async def link_recipe_ingredients(
        self, recipe_id: str, user_id: UUID
    ) -> RecipeResponse:
        """
        Links recipe ingredients with pantry items using database name matching.
        Updates recipe ingredients with pantry item IDs and returns the updated recipe.
        """
        recipe = await self.recipe_crud.get_recipe(recipe_id, user_id)
        if not recipe:
            raise ValueError("Recipe not found")

        ingredient_names = [
            ingredient.name.lower() for ingredient in recipe.data.ingredients
        ]

        pantry_items = await self.recipe_crud.get_matching_pantry_items(
            user_id, ingredient_names
        )

        pantry_by_name = {item.data.name.lower(): item for item in pantry_items}

        for ingredient in recipe.data.ingredients:
            match = pantry_by_name.get(ingredient.name.lower())
            if match:
                ingredient.pantry_item_id = str(match.id)

        return await self.recipe_crud.update_recipe(
            recipe_id=recipe_id, user_id=user_id, data=recipe.data
        )

    async def get_recipe(
        self, recipe_id: str, user_id: UUID
    ) -> Optional[RecipeResponse]:
        """Get a single recipe by ID"""
        return await self.recipe_crud.get_recipe(recipe_id, user_id)

    async def use_recipe(
        self, recipe_id: str, user_id: UUID, usage: RecipeUsageCreate
    ) -> RecipeUsage:
        """Use a recipe and update pantry quantities"""
        # Verify recipe exists
        recipe = await self.recipe_crud.get_recipe(recipe_id, user_id)
        if not recipe:
            raise ValueError("Recipe not found")

        logger.info(
            f"Using recipe {recipe_id} for user {user_id}, here is the usage: {usage}"
        )
        for item_id, quantity_used in usage.ingredients_used.items():
            pantry_item = await self.pantry_crud.get_item(item_id, user_id)
            if not pantry_item:
                raise ValueError(f"Pantry item {item_id} not found")

            new_quantity = pantry_item.data.quantity - quantity_used
            if new_quantity < 0:
                raise ValueError(
                    f"Not enough quantity for item {pantry_item.data.name}"
                )

            # If quantity becomes 0, delete the item
            if new_quantity == 0:
                await self.pantry_crud.delete_item(item_id, user_id)
            else:
                updated_data = {**pantry_item.data.dict(), "quantity": new_quantity}
                await self.pantry_crud.update_item(
                    UUID(item_id),
                    PantryItemUpdate(
                        data=updated_data, nutrition=pantry_item.nutrition
                    ),
                )

        # Record recipe usage
        return await self.recipe_crud.create_usage(user_id, recipe_id, usage)


_recipe_manager = None


def get_recipe_manager() -> RecipeManager:
    """
    Returns a singleton instance of RecipeManager.
    Initializes the instance if it doesn't exist.
    """
    global _recipe_manager
    if _recipe_manager is None:
        _recipe_manager = RecipeManager()
    return _recipe_manager
