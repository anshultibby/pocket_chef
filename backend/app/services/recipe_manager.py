import logging
import uuid
from datetime import datetime
from typing import List, Optional

from db.supabase import get_supabase

from ..models.recipes import Recipe, RecipeCreate, RecipeUpdate


class RecipeManager:
    def __init__(self):
        self.table = "recipes"
        self._generated_recipes = {}  # Store by ID for quick lookup

    def store_generated_recipes(self, recipes: List[Recipe]) -> None:
        # Store recipes with their IDs as keys
        self._generated_recipes = {str(recipe.id): recipe for recipe in recipes}

    def get_generated_recipe(self, recipe_id: str) -> Optional[Recipe]:
        return self._generated_recipes.get(str(recipe_id))

    def save_recipe(self, recipe: Recipe) -> Recipe:
        supabase = get_supabase()
        
        # Create the recipe data matching our DB schema
        recipe_data = {
            "id": str(recipe.id),
            "name": recipe.name,
            "ingredients": recipe.ingredients,
            "instructions": recipe.instructions,
            "preparation_time": str(recipe.preparation_time) if recipe.preparation_time else None,
            "difficulty": recipe.difficulty,
            "nutritional_info": recipe.nutritional_info.model_dump() if recipe.nutritional_info else None,
            "is_saved": True,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = supabase.table(self.table).insert(recipe_data).execute()
        return Recipe(**result.data[0])

    def get_saved_recipes(self) -> List[Recipe]:
        supabase = get_supabase()
        result = supabase.table(self.table).select("*").eq("is_saved", True).execute()
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
