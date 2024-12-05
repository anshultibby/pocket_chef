from typing import Dict, List

from fastapi import APIRouter, HTTPException

from ..models.recipes import Recipe, RecipeCreate
from ..services.recipe_generator import RecipeGenerator

router = APIRouter()
recipe_generator = RecipeGenerator()

# In-memory storage for saved recipes
saved_recipes = {}

@router.post("/generate", response_model=List[Recipe])
async def generate_recipes(request: RecipeCreate):
    try:
        recipes = await recipe_generator.generate_recipes(
            request.ingredients,
            request.preferences
        )
        return recipes
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save", response_model=Recipe)
async def save_recipe(recipe: Recipe):
    recipe.is_saved = True
    saved_recipes[recipe.id] = recipe
    return recipe

@router.get("/saved", response_model=List[Recipe])
async def get_saved_recipes():
    return list(saved_recipes.values())

@router.delete("/saved/{recipe_id}")
async def delete_saved_recipe(recipe_id: str):
    if recipe_id not in saved_recipes:
        raise HTTPException(status_code=404, detail="Recipe not found")
    
    del saved_recipes[recipe_id]
    return {"message": "Recipe deleted"}
