import logging
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from ..models.pantry import PantryItem, PantryItemCreate, PantryItemUpdate
from ..models.recipe_interactions import (
    InteractionType,
    RecipeInteraction,
    RecipeInteractionCreate,
)
from ..models.recipes import RecipeData, RecipeResponse
from .supabase import get_supabase

logger = logging.getLogger(__name__)


class BaseCRUD:
    """Base class for CRUD operations"""

    def __init__(self):
        self.supabase = get_supabase()


class PantryCRUD(BaseCRUD):
    def __init__(self):
        super().__init__()
        self.table = "pantry_items"

    async def get_items(self, user_id: UUID) -> List[PantryItem]:
        try:
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("user_id", str(user_id))
                .execute()
            )
            return [PantryItem(**item) for item in result.data]
        except Exception as e:
            logger.error(f"Error getting pantry items: {str(e)}")
            raise

    async def create_item(self, user_id: UUID, item: PantryItemCreate) -> PantryItem:
        try:
            data = {
                "data": item.data.model_dump(),
                "nutrition": item.nutrition.model_dump(),
                "user_id": str(user_id),
            }
            result = self.supabase.table(self.table).insert(data).execute()
            return PantryItem(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating pantry item: {str(e)}")
            raise

    async def update_item(
        self, item_id: UUID, updates: PantryItemUpdate
    ) -> Optional[PantryItem]:
        try:
            data = {}
            if updates.data:
                data["data"] = updates.data.model_dump()
            if updates.nutrition:
                data["nutrition"] = updates.nutrition.model_dump()

            result = (
                self.supabase.table(self.table)
                .update(data)
                .eq("id", str(item_id))
                .execute()
            )
            return PantryItem(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error updating pantry item: {str(e)}")
            raise

    async def delete_item(self, item_id: str, user_id: UUID) -> bool:
        try:
            result = (
                self.supabase.table(self.table)
                .delete()
                .eq("id", item_id)
                .eq("user_id", str(user_id))
                .execute()
            )
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error deleting pantry item: {str(e)}")
            raise

    async def clear_pantry(self, user_id: UUID) -> bool:
        try:
            result = (
                self.supabase.table(self.table)
                .delete()
                .eq("user_id", str(user_id))
                .execute()
            )
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error clearing pantry: {str(e)}")
            raise

    async def get_item(
        self, item_id: UUID, user_id: Optional[UUID] = None
    ) -> Optional[PantryItem]:
        try:
            query = self.supabase.table(self.table).select("*").eq("id", str(item_id))

            # If user_id is provided, add it to the query
            if user_id:
                query = query.eq("user_id", str(user_id))

            result = query.execute()

            return PantryItem(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error getting pantry item: {str(e)}")
            raise

    async def get_items_by_names(
        self, user_id: UUID, names: List[str]
    ) -> List[PantryItem]:
        """Get pantry items by a list of names for a user"""
        try:
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("user_id", str(user_id))
                .filter("data->>'name'", "in", f"({','.join(names)})")
                .execute()
            )
            return [PantryItem(**item) for item in result.data]
        except Exception as e:
            logger.error(f"Error getting pantry items by names: {str(e)}")
            raise


class RecipeCRUD(BaseCRUD):
    def __init__(self):
        super().__init__()
        self.table = "recipes"

    def get_recipes_by_categories(
        self, user_id: UUID, min_per_category: dict[str, int]
    ) -> dict[str, list[RecipeResponse]]:
        try:
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("user_id", str(user_id))
                .execute()
            )

            # Organize recipes by category
            recipes_by_category: dict[str, list[RecipeResponse]] = {}
            for item in result.data:
                recipe = RecipeResponse(**item)
                if recipe.category not in recipes_by_category:
                    recipes_by_category[recipe.category] = []
                recipes_by_category[recipe.category].append(recipe)

            return recipes_by_category
        except Exception as e:
            logger.error(f"Error getting recipes by categories: {str(e)}")
            raise

    def cleanup_old_recipes(self, user_id: UUID, keep_days: int = 7):
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=keep_days)

            # Get recipes that have no save interactions and are older than cutoff
            result = self.supabase.rpc(
                "delete_unused_recipes",
                {
                    "user_id_param": str(user_id),
                    "cutoff_date_param": cutoff_date.isoformat(),
                },
            ).execute()
        except Exception as e:
            logger.error(f"Error cleaning up old recipes: {str(e)}")
            raise

    async def create_recipe(self, user_id: UUID, data: RecipeData) -> RecipeResponse:
        try:
            result = (
                self.supabase.table(self.table)
                .insert(
                    {
                        "user_id": str(user_id),
                        "data": data.model_dump(),
                    }
                )
                .execute()
            )
            return RecipeResponse(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating recipe: {str(e)}")
            raise

    async def update_recipe(
        self, recipe_id: str, user_id: UUID, data: RecipeData
    ) -> RecipeResponse:
        try:
            result = (
                self.supabase.table(self.table)
                .update({"data": data.model_dump()})
                .eq("id", recipe_id)
                .eq("user_id", str(user_id))
                .execute()
            )
            return RecipeResponse(**result.data[0])
        except Exception as e:
            logger.error(f"Error updating recipe: {str(e)}")
            raise

    async def get_matching_pantry_items(
        self, user_id: UUID, ingredient_names: List[str]
    ) -> List[PantryItem]:
        """Get pantry items that match the given ingredient names"""
        try:
            # Use a single DB query to get all matching items
            result = (
                self.supabase.table("pantry_items")
                .select("*")
                .eq("user_id", str(user_id))
                .filter("LOWER(data->>'name')", "in", f"({','.join(ingredient_names)})")
                .execute()
            )
            return [PantryItem(**item) for item in result.data]
        except Exception as e:
            logger.error(f"Error getting matching pantry items: {str(e)}")
            raise

    async def create_interaction(
        self, user_id: UUID, recipe_id: UUID, interaction: RecipeInteractionCreate
    ) -> RecipeInteraction:
        try:
            # First check if interaction exists
            result = (
                self.supabase.table("recipe_interactions")
                .select("*")
                .eq("user_id", str(user_id))
                .eq("recipe_id", str(recipe_id))
                .eq("type", interaction.type)
                .execute()
            )

            if result.data:
                # Update existing interaction
                result = (
                    self.supabase.table("recipe_interactions")
                    .update(
                        {
                            "data": interaction.data.dict(),
                            "updated_at": datetime.utcnow().isoformat(),
                        }
                    )
                    .eq("user_id", str(user_id))
                    .eq("recipe_id", str(recipe_id))
                    .eq("type", interaction.type)
                    .execute()
                )
            else:
                # Create new interaction
                result = (
                    self.supabase.table("recipe_interactions")
                    .insert(
                        {
                            "user_id": str(user_id),
                            "recipe_id": str(recipe_id),
                            "type": interaction.type,
                            "data": interaction.data.dict(),
                        }
                    )
                    .execute()
                )

            if not result.data:
                raise ValueError("Failed to create/update interaction")

            return RecipeInteraction(**result.data[0])

        except Exception as e:
            logger.error(f"Error creating recipe interaction: {str(e)}")
            raise

    async def get_recipe_interactions(
        self,
        user_id: UUID,
        recipe_id: Optional[UUID] = None,
        interaction_type: Optional[InteractionType] = None,
    ) -> List[RecipeInteraction]:
        try:
            query = (
                self.supabase.table("recipe_interactions")
                .select("*")
                .eq("user_id", str(user_id))
            )

            if recipe_id:
                query = query.eq("recipe_id", str(recipe_id))
            if interaction_type:
                query = query.eq("type", interaction_type)

            result = query.order("created_at", desc=True).execute()
            return [RecipeInteraction(**item) for item in result.data]
        except Exception as e:
            logger.error(f"Error getting recipe interactions: {str(e)}")
            raise

    async def get_recipe(
        self, recipe_id: str, user_id: UUID
    ) -> Optional[RecipeResponse]:
        """Get a single recipe by ID"""
        try:
            result = (
                self.supabase.table(self.table)
                .select("*")
                .eq("id", recipe_id)
                .eq("user_id", str(user_id))
                .execute()
            )
            return RecipeResponse(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error getting recipe: {str(e)}")
            raise
