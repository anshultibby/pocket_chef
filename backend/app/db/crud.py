import logging
from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from ..models.pantry import (
    Ingredient,
    IngredientData,
    PantryItem,
    PantryItemCreate,
    PantryItemUpdate,
)
from ..models.recipes import RecipeCreate, RecipeResponse
from .supabase import get_supabase

logger = logging.getLogger(__name__)

class BaseCRUD:
    """Base class for CRUD operations"""
    def __init__(self):
        self.supabase = get_supabase()

class IngredientCRUD(BaseCRUD):
    def __init__(self):
        super().__init__()
        self.table = 'ingredients'

    async def find_by_name(self, name: str) -> Optional[Ingredient]:
        try:
            result = self.supabase.table(self.table)\
                .select("*")\
                .filter('data->>names->canonical', 'eq', name)\
                .execute()
            return Ingredient(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error finding ingredient by name: {str(e)}")
            raise

    async def create_or_get(self, ingredient_data: IngredientData) -> Ingredient:
        try:
            existing = await self.find_by_name(ingredient_data.names.canonical)
            if existing:
                return existing

            result = self.supabase.table(self.table)\
                .insert({'data': ingredient_data.model_dump()})\
                .execute()
            return Ingredient(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating ingredient: {str(e)}")
            raise

class PantryCRUD(BaseCRUD):
    def __init__(self):
        super().__init__()
        self.table = 'pantry_items'

    async def get_items(self, user_id: UUID) -> List[PantryItem]:
        try:
            result = self.supabase.table(self.table)\
                .select("*")\
                .eq("user_id", str(user_id))\
                .execute()
            return [PantryItem(**item) for item in result.data]
        except Exception as e:
            logger.error(f"Error getting pantry items: {str(e)}")
            raise

    async def create_item(
        self, 
        user_id: UUID, 
        item: PantryItemCreate, 
        ingredient_id: UUID
    ) -> PantryItem:
        try:
            data = {
                'data': {
                    'display_name': item.name,
                    'quantity': item.quantity,
                    'unit': item.unit,
                    'notes': item.notes
                },
                'ingredient_id': str(ingredient_id),
                'user_id': str(user_id),
                'expiry_date': item.expiry_date
            }
            result = self.supabase.table(self.table)\
                .insert(data)\
                .execute()
            return PantryItem(**result.data[0])
        except Exception as e:
            logger.error(f"Error creating pantry item: {str(e)}")
            raise

    async def update_item(
        self, 
        item_id: str, 
        user_id: UUID, 
        update_data: PantryItemUpdate
    ) -> Optional[PantryItem]:
        try:
            data = update_data.model_dump(exclude_unset=True)
            result = self.supabase.table(self.table)\
                .update(data)\
                .eq("id", item_id)\
                .eq("user_id", str(user_id))\
                .execute()
            return PantryItem(**result.data[0]) if result.data else None
        except Exception as e:
            logger.error(f"Error updating pantry item: {str(e)}")
            raise

    async def delete_item(self, item_id: str, user_id: UUID) -> bool:
        try:
            result = self.supabase.table(self.table)\
                .delete()\
                .eq("id", item_id)\
                .eq("user_id", str(user_id))\
                .execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error deleting pantry item: {str(e)}")
            raise

class RecipeCRUD(BaseCRUD):
    def __init__(self):
        super().__init__()
        self.table = 'recipes'

    def get_recipes_by_categories(
        self,
        user_id: UUID,
        min_per_category: dict[str, int]
    ) -> dict[str, list[RecipeResponse]]:
        try:
            result = self.supabase.table(self.table)\
                .select("*")\
                .eq("user_id", str(user_id))\
                .execute()
            
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

    def get_saved_recipes(self, user_id: UUID) -> list[RecipeResponse]:
        try:
            result = self.supabase.table(self.table)\
                .select("*")\
                .eq("user_id", str(user_id))\
                .eq("is_saved", True)\
                .execute()
            return [RecipeResponse(**item) for item in result.data]
        except Exception as e:
            logger.error(f"Error getting saved recipes: {str(e)}")
            raise

    def save_recipe(self, recipe_id: str, user_id: UUID) -> RecipeResponse:
        try:
            result = self.supabase.table(self.table)\
                .update({"is_saved": True})\
                .eq("id", recipe_id)\
                .eq("user_id", str(user_id))\
                .execute()
            return RecipeResponse(**result.data[0])
        except Exception as e:
            logger.error(f"Error saving recipe: {str(e)}")
            raise

    def delete_saved_recipe(self, recipe_id: str, user_id: UUID) -> bool:
        try:
            result = self.supabase.table(self.table)\
                .update({"is_saved": False})\
                .eq("id", recipe_id)\
                .eq("user_id", str(user_id))\
                .execute()
            return len(result.data) > 0
        except Exception as e:
            logger.error(f"Error deleting saved recipe: {str(e)}")
            raise

    def cleanup_old_recipes(self, user_id: UUID, keep_days: int = 7):
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=keep_days)
            self.supabase.table(self.table)\
                .delete()\
                .eq("user_id", str(user_id))\
                .eq("is_saved", False)\
                .lt("created_at", cutoff_date.isoformat())\
                .execute()
        except Exception as e:
            logger.error(f"Error cleaning up old recipes: {str(e)}")
            raise
