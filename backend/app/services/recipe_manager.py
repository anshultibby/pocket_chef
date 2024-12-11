import logging
import uuid
from datetime import datetime, timedelta
from typing import List, Optional, Dict
from uuid import UUID

from db.supabase import get_supabase

from ..models.recipes import Recipe, RecipeCreate, RecipeUpdate


class RecipeManager:
    def __init__(self):
        self.table = "recipes"
        self.supabase = get_supabase()  # Use service role client

    def store_generated_recipes(self, recipes: List[Recipe], user_id: UUID) -> None:
        for recipe in recipes:
            recipe_data = {
                **recipe.model_dump(),
                "user_id": str(user_id),
            }
            self.supabase.table(self.table).insert(recipe_data).execute()

    def get_generated_recipe(self, recipe_id: str, user_id: UUID) -> Optional[Recipe]:
        result = self.supabase.table(self.table)\
            .select("*")\
            .eq("id", recipe_id)\
            .eq("user_id", str(user_id))\
            .eq("is_generated", True)\
            .execute()
        return Recipe(**result.data[0]) if result.data else None

    def save_recipe(self, recipe_id: str, user_id: UUID) -> Recipe:
        result = self.supabase.table(self.table)\
            .update({"is_saved": True, "is_generated": False})\
            .eq("id", recipe_id)\
            .eq("user_id", str(user_id))\
            .execute()
            
        if not result.data:
            raise ValueError("Recipe not found")
            
        return Recipe(**result.data[0])

    def get_saved_recipes(self, user_id: UUID) -> List[Recipe]:
        result = self.supabase.table(self.table)\
            .select("*")\
            .eq("user_id", str(user_id))\
            .eq("is_saved", True)\
            .execute()
        return [Recipe(**item) for item in result.data]

    def delete_saved_recipe(self, recipe_id: str, user_id: UUID) -> bool:
        result = self.supabase.table(self.table)\
            .delete()\
            .eq("id", recipe_id)\
            .eq("user_id", str(user_id))\
            .eq("is_saved", True)\
            .execute()
        return len(result.data) > 0

    def clear(self):
        self._generated_recipes.clear()

    def cleanup_old_recipes(self, user_id: UUID, keep_days: int = 7):
        """Remove old generated recipes that aren't saved"""
        cutoff_date = datetime.now() - timedelta(days=keep_days)
        
        self.supabase.table(self.table)\
            .delete()\
            .eq("user_id", str(user_id))\
            .eq("is_saved", False)\
            .lt("created_at", cutoff_date.isoformat())\
            .execute()

    def get_recipes_by_categories(
        self, 
        user_id: UUID,
        min_per_category: Dict[str, int]
    ) -> Dict[str, List[Recipe]]:
        """Get existing recipes grouped by category"""
        
        # Get recently generated recipes
        result = self.supabase.table(self.table)\
            .select("*")\
            .eq("user_id", str(user_id))\
            .eq("is_saved", False)\
            .order("created_at", desc=True)\
            .execute()

        # Group by category
        recipes_by_category: Dict[str, List[Recipe]] = {
            category: [] for category in min_per_category.keys()
        }
        
        for row in result.data:
            recipe = Recipe(**row)
            if recipe.meal_category in recipes_by_category:
                recipes_by_category[recipe.meal_category].append(recipe)

        return recipes_by_category

# Create a single instance at module level
_recipe_manager = RecipeManager()

def get_recipe_manager():
    return _recipe_manager
