from typing import List, Optional
from ..models.recipes import Recipe

class RecipeManager:
    def __init__(self):
        self._generated_recipes = []
        self._saved_recipes = {}

    def store_generated_recipes(self, recipes: List[Recipe]) -> None:
        self._generated_recipes = recipes

    def get_generated_recipes(self) -> List[Recipe]:
        return self._generated_recipes

    def save_recipe(self, recipe: Recipe) -> Recipe:
        recipe.is_saved = True
        self._saved_recipes[recipe.id] = recipe
        return recipe

    def get_saved_recipes(self) -> List[Recipe]:
        return list(self._saved_recipes.values())

    def remove_saved_recipe(self, recipe_id: str) -> bool:
        if recipe_id not in self._saved_recipes:
            return False
        del self._saved_recipes[recipe_id]
        return True

    def clear(self):
        self._generated_recipes.clear()
        self._saved_recipes.clear()

# Create a single instance at module level
_recipe_manager = RecipeManager()

def get_recipe_manager():
    return _recipe_manager
