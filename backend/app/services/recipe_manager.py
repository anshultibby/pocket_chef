import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from db.supabase import get_supabase

from ..models.recipes import NutritionalInfo, RecipeCreate, RecipeResponse, RecipeUpdate


class RecipeManager:
    def __init__(self):
        self.table = "recipes"
        self.supabase = get_supabase()  # Use service role client

    def store_generated_recipes(self, recipes: List[RecipeCreate], user_id: UUID) -> List[RecipeResponse]:
        """Store recipes in database, returning full RecipeResponse objects"""
        stored_recipes = []
        for recipe in recipes:
            recipe_data = {
                **recipe.model_dump(),
                "user_id": str(user_id)
            }
            result = self.supabase.table(self.table).insert(recipe_data).execute()
            stored_recipes.append(RecipeResponse(**result.data[0]))
        return stored_recipes

    def get_generated_recipe(self, recipe_id: str, user_id: UUID) -> Optional[RecipeResponse]:
        result = self.supabase.table(self.table)\
            .select("*")\
            .eq("id", recipe_id)\
            .eq("user_id", str(user_id))\
            .eq("is_generated", True)\
            .execute()
        return RecipeResponse(**result.data[0]) if result.data else None

    def save_recipe(self, recipe_id: str, user_id: UUID) -> RecipeResponse:
        result = self.supabase.table(self.table)\
            .update({"is_saved": True, "is_generated": False})\
            .eq("id", recipe_id)\
            .eq("user_id", str(user_id))\
            .execute()
            
        if not result.data:
            raise ValueError("Recipe not found")
            
        return RecipeResponse(**result.data[0])

    def get_saved_recipes(self, user_id: UUID) -> List[RecipeResponse]:
        result = self.supabase.table(self.table)\
            .select("*")\
            .eq("user_id", str(user_id))\
            .eq("is_saved", True)\
            .execute()
        return [RecipeResponse(**item) for item in result.data]

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
    ) -> Dict[str, List[RecipeResponse]]:
        """Get existing recipes grouped by category"""
        
        # Get recently generated recipes
        result = self.supabase.table(self.table)\
            .select("*")\
            .eq("user_id", str(user_id))\
            .eq("is_saved", False)\
            .order("created_at", desc=True)\
            .execute()

        # Group by category
        recipes_by_category: Dict[str, List[RecipeResponse]] = {
            category: [] for category in min_per_category.keys()
        }
        
        for row in result.data:
            recipe = RecipeResponse(**row)
            if recipe.meal_category in recipes_by_category:
                recipes_by_category[recipe.meal_category].append(recipe)

        return recipes_by_category

    def parse_recipe_response(self, content: str) -> List[RecipeCreate]:
        """Parse Claude's JSON response into RecipeCreate objects"""
        try:
            recipes_data = json.loads(content)
            recipes = []
            
            for recipe_data in recipes_data:
                # Parse nutritional info
                nutritional_info = None
                if 'nutritionalInfo' in recipe_data:
                    nutritional_info = NutritionalInfo(
                        calories=int(recipe_data['nutritionalInfo']['calories']),
                        protein=float(recipe_data['nutritionalInfo']['protein']),
                        carbs=float(recipe_data['nutritionalInfo']['carbs']),
                        fat=float(recipe_data['nutritionalInfo']['fat'])
                    )

                # Create RecipeCreate object (without id/user_id/timestamps)
                recipe = RecipeCreate(
                    name=recipe_data['name'],
                    ingredients=recipe_data['ingredients'],
                    instructions=recipe_data['instructions'],
                    preparation_time=recipe_data.get('preparationTime'),
                    difficulty=recipe_data.get('difficulty', 'medium').lower(),
                    nutritional_info=nutritional_info,
                    is_saved=False,
                    meal_category='dinner'
                )
                recipes.append(recipe)
            
            return recipes
            
        except Exception as e:
            self.logger.error(f"Error parsing recipe response: {str(e)}")
            raise ValueError(f"Failed to parse recipes: {str(e)}")

# Create a single instance at module level
_recipe_manager = RecipeManager()

def get_recipe_manager():
    return _recipe_manager
