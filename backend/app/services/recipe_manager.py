import json
import logging
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from uuid import UUID

from db.supabase import get_supabase

from ..models.recipes import NutritionalInfo, RecipeCreate, RecipeResponse, RecipeUpdate
from ..services.claude_service import ClaudeService


class RecipeManager:
    def __init__(self):
        self.table = "recipes"
        self.supabase = get_supabase()  # Use service role client
        self.claude_service = ClaudeService()
        self.logger = logging.getLogger(__name__)

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
            category = recipe.meal_category
            if category in recipes_by_category:
                # Only add up to the minimum required for each category
                if len(recipes_by_category[category]) < min_per_category[category]:
                    recipes_by_category[category].append(recipe)

        return recipes_by_category

    def parse_recipe_response(self, content: str) -> List[RecipeCreate]:
        """Parse Claude's JSON response into RecipeCreate objects"""
        try:
            recipes_data = json.loads(content)
            recipes = []
            
            for recipe_data in recipes_data:
                # Handle both camelCase and snake_case keys
                nutritional_info = None
                if 'nutritional_info' in recipe_data or 'nutritionalInfo' in recipe_data:
                    info_data = recipe_data.get('nutritional_info') or recipe_data.get('nutritionalInfo')
                    nutritional_info = NutritionalInfo(
                        calories=int(info_data['calories']),
                        protein=float(info_data['protein']),
                        carbs=float(info_data['carbs']),
                        fat=float(info_data['fat'])
                    )

                recipe = RecipeCreate(
                    name=recipe_data['name'],
                    ingredients=recipe_data['ingredients'],
                    instructions=recipe_data['instructions'],
                    preparation_time=recipe_data.get('preparation_time') or recipe_data.get('preparationTime'),
                    difficulty=(recipe_data.get('difficulty') or 'medium').lower(),
                    nutritional_info=nutritional_info,
                    is_saved=False,
                    meal_category=(recipe_data.get('meal_category') or recipe_data.get('mealCategory', 'dinner')).lower()
                )
                recipes.append(recipe)
            
            return recipes
            
        except Exception as e:
            self.logger.error(f"Error parsing recipe response: {str(e)}")
            raise ValueError(f"Failed to parse recipes: {str(e)}")

    async def generate_recipes_for_categories(
        self,
        user_id: UUID,
        categories_to_generate: List[Dict[str, int]],
        ingredients: List[str]
    ) -> Dict[str, List[RecipeResponse]]:
        """Generate recipes for specific categories and store them"""
        
        # Format preferences for Claude
        preferences = "Generate exactly these recipes:\n" + "\n".join(
            f"- {cat['count']} {cat['category']} recipes" 
            for cat in categories_to_generate
        )
        
        # Get raw response from Claude
        raw_response = await self.claude_service.generate_recipes(
            ingredients=ingredients,
            preferences=preferences
        )
        
        # Parse and store recipes
        recipe_creates = self.parse_recipe_response(raw_response)
        stored_recipes = self.store_generated_recipes(
            recipes=recipe_creates, 
            user_id=user_id
        )
        
        # Group by category
        recipes_by_category: Dict[str, List[RecipeResponse]] = {}
        for recipe in stored_recipes:
            category = recipe.meal_category
            if category not in recipes_by_category:
                recipes_by_category[category] = []
            recipes_by_category[category].append(recipe)
        
        return recipes_by_category

# Create a single instance at module level
_recipe_manager = RecipeManager()

def get_recipe_manager():
    return _recipe_manager
