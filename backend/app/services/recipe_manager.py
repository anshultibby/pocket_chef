import logging
from typing import Dict, List, Optional
from uuid import UUID

from ..db.crud import RecipeCRUD
from ..models.pantry import PantryItem
from ..models.recipes import (
    ListOfRecipeData,
    RecipeData,
    RecipePreferences,
    RecipeResponse,
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

    async def generate_recipe(
        self, preferences: RecipePreferences, user_id: UUID
    ) -> List[RecipeResponse]:
        """Generate recipe and link ingredients to pantry items"""
        pantry_manager = get_pantry_manager()
        pantry_items = await pantry_manager.get_items(user_id)
        final_recipes = []
        list_of_recipe_data = await self.claude_service.generate_recipes(
            ListOfRecipeData,
            ingredients=[item.data.name for item in pantry_items],
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
