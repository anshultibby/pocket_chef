import logging
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from ..db.crud import PantryCRUD, RecipeCRUD
from ..models.pantry import PantryItemUpdate
from ..models.recipe_interactions import (
    CookData,
    InteractionType,
    RecipeInteraction,
    RecipeInteractionCreate,
)
from ..models.recipes import ListOfRecipeData, RecipePreferences, RecipeResponse
from .llm.providers.claude import ClaudeService
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
        try:
            # Get unsaved recipes from last 24 hours
            unsaved_recipes = await self.get_unsaved_recipes(user_id)
            if unsaved_recipes:
                avoid_text = f"\nPlease avoid generating these or similar recipes: {', '.join(unsaved_recipes)}"
                if preferences.custom_preferences:
                    preferences.custom_preferences += avoid_text
                else:
                    preferences.custom_preferences = avoid_text

            logger.info(
                f"Generating recipe for user {user_id} with preferences: {preferences}"
            )
            pantry_manager = get_pantry_manager()
            pantry_items = await pantry_manager.get_items(user_id)
            final_recipes = []
            ingredients = [
                f"{item.data.name} ({item.data.quantity} \
{item.data.unit} ${item.data.price} )"
                for item in pantry_items
            ]
            list_of_recipe_data = await self.claude_service.generate_recipes(
                ListOfRecipeData,
                ingredients=ingredients,
                preferences=preferences,
                user_id=user_id,
                use_cache=True,
            )
            for recipe_data in list_of_recipe_data.recipes:
                recipe_crud = await self.recipe_crud.create_recipe(
                    user_id=user_id,
                    data=recipe_data,
                )
                final_recipes.append(recipe_crud)
            return final_recipes

        except Exception as e:
            logger.error(f"Error during recipe generation: {str(e)}")
            raise

    async def generate_shoppable_recipes(
        self, preferences: RecipePreferences, user_id: UUID
    ):
        pantry_manager = get_pantry_manager()
        pantry_items = pantry_manager.get_items()
        ingredients = [
            f"{item.data.name} ({item.data.quantity} \
{item.data.unit} ${item.data.price} )"
            for item in pantry_items
        ]
        list_of_recipes = await self.claude_service.generate_recipes_from_market(
            ListOfRecipeData,
            ingredients=ingredients,
            preferences=preferences,
        )

        ingredients_to_shop = []
        for recipe in list_of_recipes:
            for ingredient in recipe.ingredients:
                if ingredient.is_available == False:
                    ingredients_to_shop.append(ingredient)

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
        self, recipe_id: str, user_id: UUID, usage: CookData
    ) -> RecipeInteraction:
        """Use a recipe and update pantry quantities"""
        logger.info(f"Starting recipe usage for recipe {recipe_id} by user {user_id}")

        # Verify recipe exists
        recipe = await self.recipe_crud.get_recipe(recipe_id, user_id)
        if not recipe:
            logger.error(f"Recipe {recipe_id} not found for user {user_id}")
            raise ValueError("Recipe not found")

        try:
            # Update pantry quantities
            for item_id, quantity_used in usage.ingredients_used.items():
                logger.info(
                    f"Updating quantity for item {item_id}: using {quantity_used}"
                )
                pantry_item = await self.pantry_crud.get_item(item_id, user_id)
                if not pantry_item:
                    raise ValueError(f"Pantry item {item_id} not found")

                new_quantity = round(pantry_item.data.quantity - quantity_used, 2)
                if new_quantity < 0:
                    raise ValueError(
                        f"Not enough quantity for item {pantry_item.data.name}"
                    )

                if new_quantity == 0:
                    await self.pantry_crud.delete_item(item_id, user_id)
                    logger.info(f"Deleted item {item_id} as quantity reached 0")
                else:
                    updated_data = {**pantry_item.data.dict(), "quantity": new_quantity}
                    await self.pantry_crud.update_item(
                        UUID(item_id),
                        PantryItemUpdate(
                            data=updated_data, nutrition=pantry_item.nutrition
                        ),
                    )
                    logger.info(f"Updated item {item_id} to quantity {new_quantity}")

            # Record recipe usage
            interaction = await self.recipe_crud.create_interaction(
                user_id=user_id,
                recipe_id=UUID(recipe_id),
                interaction=RecipeInteractionCreate(type="cook", data=usage),
            )
            logger.info(
                f"Successfully recorded recipe usage interaction for recipe {recipe_id}"
            )
            return interaction

        except Exception as e:
            logger.error(f"Error during recipe usage: {str(e)}")
            raise

    async def get_saved_recipes_with_availability(
        self, user_id: UUID
    ) -> List[RecipeResponse]:
        """Get all saved recipes for a user by joining interactions and recipes tables"""
        try:
            # Get saved interactions and join with recipes
            result = (
                self.recipe_crud.supabase.table("recipe_interactions")
                .select("*, recipes(*)")
                .eq("user_id", str(user_id))
                .eq("type", "save")
                .order("created_at", desc=True)
                .execute()
            )

            # Transform the joined data into RecipeResponse objects
            recipes = []
            for item in result.data:
                recipe_data = item["recipes"]
                if recipe_data:
                    recipes.append(RecipeResponse(**recipe_data))

            return recipes

        except Exception as e:
            logger.error(f"Error getting saved recipes: {str(e)}")
            raise

    async def get_recipe_interactions(
        self,
        user_id: UUID,
        recipe_id: Optional[UUID] = None,
        interaction_type: Optional[InteractionType] = None,
    ) -> List[RecipeInteraction]:
        """Get recipe interactions for a user, optionally filtered by recipe and type"""
        try:
            return await self.recipe_crud.get_recipe_interactions(
                user_id=user_id, recipe_id=recipe_id, interaction_type=interaction_type
            )
        except Exception as e:
            logger.error(f"Error getting recipe interactions: {str(e)}")
            raise

    async def create_interaction(
        self, user_id: UUID, recipe_id: UUID, interaction: RecipeInteractionCreate
    ) -> RecipeInteraction:
        """Create a recipe interaction"""
        try:
            # Special handling for cook interactions
            if interaction.type == InteractionType.COOK:
                # Update pantry quantities but don't create interaction here
                await self._update_pantry_quantities(
                    recipe_id=str(recipe_id), user_id=user_id, usage=interaction.data
                )

            # Create the interaction record
            return await self.recipe_crud.create_interaction(
                user_id=user_id, recipe_id=recipe_id, interaction=interaction
            )
        except Exception as e:
            logger.error(f"Error creating recipe interaction: {str(e)}")
            raise

    async def _update_pantry_quantities(
        self, recipe_id: str, user_id: UUID, usage: CookData
    ) -> None:
        """Internal method to update pantry quantities when cooking"""
        # Verify recipe exists
        recipe = await self.recipe_crud.get_recipe(recipe_id, user_id)
        if not recipe:
            logger.error(f"Recipe {recipe_id} not found for user {user_id}")
            raise ValueError("Recipe not found")

        # Update pantry quantities
        for item_id, quantity_used in usage.ingredients_used.items():
            logger.info(f"Updating quantity for item {item_id}: using {quantity_used}")
            pantry_item = await self.pantry_crud.get_item(item_id, user_id)
            if not pantry_item:
                raise ValueError(f"Pantry item {item_id} not found")

            new_quantity = round(pantry_item.data.quantity - quantity_used, 2)
            if new_quantity < 0:
                raise ValueError(
                    f"Not enough quantity for item {pantry_item.data.name}"
                )

            if new_quantity == 0:
                await self.pantry_crud.delete_item(item_id, user_id)
                logger.info(f"Deleted item {item_id} as quantity reached 0")
            else:
                updated_data = {**pantry_item.data.dict(), "quantity": new_quantity}
                await self.pantry_crud.update_item(
                    UUID(item_id),
                    PantryItemUpdate(
                        data=updated_data, nutrition=pantry_item.nutrition
                    ),
                )
                logger.info(f"Updated item {item_id} to quantity {new_quantity}")

    async def get_all_recipes(self, user_id: UUID) -> List[RecipeResponse]:
        """Get all recipes for a user"""
        try:
            result = (
                self.recipe_crud.supabase.table("recipes")
                .select("*")
                .eq("user_id", str(user_id))
                .order("created_at", desc=True)
                .execute()
            )
            return [RecipeResponse(**recipe) for recipe in result.data]
        except Exception as e:
            logger.error(f"Error getting recipes: {str(e)}")
            raise

    async def get_unsaved_recipes(self, user_id: UUID, hours: int = 1) -> List[str]:
        """Get names of up to 10 most recent unsaved recipes from the last hour"""
        try:
            cutoff_time = datetime.utcnow() - timedelta(hours=hours)

            # Get all recipes from last hour
            recent_recipes = await self.recipe_crud.get_recipes_since(
                user_id=user_id, since=cutoff_time
            )

            # Get saved recipe IDs
            saved_interactions = await self.recipe_crud.get_recipe_interactions(
                user_id=user_id, interaction_type=InteractionType.SAVE
            )
            saved_ids = {
                str(interaction.recipe_id) for interaction in saved_interactions
            }

            # Return names of up to 10 most recent unsaved recipes
            unsaved_recipes = [
                recipe.data.name
                for recipe in recent_recipes
                if str(recipe.id) not in saved_ids
            ]
            return unsaved_recipes[-10:]  # Return only the last 10 recipes
        except Exception as e:
            logger.error(f"Error getting unsaved recipes: {str(e)}")
            return []


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
