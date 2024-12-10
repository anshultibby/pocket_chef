import logging
import uuid
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from db.supabase import get_supabase

from ..models.recipes import Recipe, RecipeCreate, RecipeUpdate


class RecipeManager:
    def __init__(self):
        self.table = "recipes"

    def store_generated_recipes(self, recipes: List[Recipe], user_id: UUID, auth_token: str) -> None:
        supabase = get_supabase(auth_token)
        for recipe in recipes:
            recipe_data = {
                **recipe.model_dump(),
                "user_id": str(user_id),
            }
            supabase.table(self.table).insert(recipe_data).execute()

    def get_generated_recipe(self, recipe_id: str, auth_token: str) -> Optional[Recipe]:
        supabase = get_supabase(auth_token)
        result = supabase.table(self.table)\
            .select("*")\
            .eq("id", recipe_id)\
            .eq("is_generated", True)\
            .execute()
        return Recipe(**result.data[0]) if result.data else None

    def save_recipe(self, recipe_id: str, user_id: UUID, auth_token: str) -> Recipe:
        supabase = get_supabase(auth_token)
        
        # Update the recipe to mark it as saved
        result = supabase.table(self.table)\
            .update({"is_saved": True, "is_generated": False})\
            .eq("id", recipe_id)\
            .execute()
            
        if not result.data:
            raise ValueError("Recipe not found")
            
        return Recipe(**result.data[0])

    def get_saved_recipes(self, user_id: UUID) -> List[Recipe]:
        supabase = get_supabase()
        result = supabase.table(self.table)\
            .select("*")\
            .eq("is_saved", True)\
            .eq("user_id", str(user_id))\
            .execute()
        return [Recipe(**recipe) for recipe in result.data]

    def remove_saved_recipe(self, recipe_id: str) -> bool:
        supabase = get_supabase()
        result = supabase.table(self.table).delete().eq("id", recipe_id).execute()
        return bool(result.data)

    def clear(self):
        self._generated_recipes.clear()

# Create a single instance at module level
_recipe_manager = RecipeManager()

def get_recipe_manager():
    return _recipe_manager
