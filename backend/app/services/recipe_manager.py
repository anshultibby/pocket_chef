from typing import List, Optional

from ..models.recipes import Recipe, RecipeCreate, RecipeUpdate
from ..services.supabase import get_supabase


class RecipeManager:
    def __init__(self):
        self.table = "recipes"
        self._generated_recipes = []

    def store_generated_recipes(self, recipes: List[Recipe]) -> None:
        self._generated_recipes = recipes

    def get_generated_recipes(self) -> List[Recipe]:
        return self._generated_recipes

    async def save_recipe(self, recipe: RecipeCreate) -> Recipe:
        supabase = get_supabase()
        data = recipe.model_dump()
        data['is_saved'] = True
        result = await supabase.table(self.table).insert(data).execute()
        return Recipe(**result.data[0])

    async def get_saved_recipes(self) -> List[Recipe]:
        supabase = get_supabase()
        result = await supabase.table(self.table).select("*").eq("is_saved", True).execute()
        return [Recipe(**recipe) for recipe in result.data]

    async def remove_saved_recipe(self, recipe_id: str) -> bool:
        supabase = get_supabase()
        result = await supabase.table(self.table).delete().eq("id", recipe_id).execute()
        return bool(result.data)

    def clear(self):
        self._generated_recipes.clear()

# Create a single instance at module level
_recipe_manager = RecipeManager()

def get_recipe_manager():
    return _recipe_manager
