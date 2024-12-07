import json
from typing import Dict, List

from fastapi import APIRouter, HTTPException

from ..models.recipes import Recipe, RecipeCreate
from ..services.claude_service import ClaudeService
from ..services.pantry import get_pantry_manager
from ..services.recipe_manager import get_recipe_manager

router = APIRouter()
claude_service = ClaudeService()
recipe_manager = get_recipe_manager()
pantry_manager = get_pantry_manager()

@router.post("/generate", response_model=List[Recipe])
def generate_recipes(request: RecipeCreate):
    try:
        # Get all available ingredients from both the request and pantry
        all_ingredients = set(request.ingredients)  # Convert to set to remove duplicates
        
        # Add pantry items to available ingredients
        pantry_items = pantry_manager.get_items()
        for item in pantry_items:
            all_ingredients.add(f"{item.name} ({item.quantity} {item.unit})")
        
        # Create a prompt from all available ingredients and preferences
        prompt = f"Create recipes using any of these ingredients:\n"
        prompt += "Specified ingredients: " + ", ".join(request.ingredients) + "\n"
        prompt += "Pantry ingredients: " + ", ".join(
            f"{item.name} ({item.quantity} {item.unit})" 
            for item in pantry_items
        ) + "\n"
        
        if request.preferences:
            prompt += f"Consider these preferences: {request.preferences}"
        
        recipes_json = claude_service.get_recipes(prompt)
        recipes_data = json.loads(recipes_json)
        
        # Convert the JSON data to Recipe objects
        recipes = [Recipe(**recipe_data) for recipe_data in recipes_data]
        recipe_manager.store_generated_recipes(recipes)
        return recipes
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to generate recipes: {str(e)}")

@router.post("/save", response_model=Recipe)
def save_recipe(recipe: Recipe):
    try:
        return recipe_manager.save_recipe(recipe)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to save recipe: {str(e)}")

@router.get("/saved", response_model=List[Recipe])
def get_saved_recipes():
    try:
        return recipe_manager.get_saved_recipes()
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch saved recipes: {str(e)}")

@router.delete("/saved/{recipe_id}")
def delete_saved_recipe(recipe_id: str):
    if not recipe_manager.remove_saved_recipe(recipe_id):
        raise HTTPException(status_code=404, detail="Recipe not found")
    return {"message": "Recipe deleted"}
