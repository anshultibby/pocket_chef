import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, HTTPException

from ..models.recipes import Recipe, RecipeCreate, RecipeGenerateRequest, RecipeResponse
from ..services.claude_service import ClaudeService
from ..services.pantry import get_pantry_manager
from ..services.recipe_manager import get_recipe_manager

router = APIRouter()
logger = logging.getLogger(__name__)
claude_service = ClaudeService()
recipe_manager = get_recipe_manager()
pantry_manager = get_pantry_manager()

@router.post("/generate", response_model=List[Recipe])
async def generate_recipes(request: RecipeGenerateRequest):
    try:
        all_ingredients = set(request.ingredients)
        
        # Add pantry items to available ingredients
        pantry_items = pantry_manager.get_items()
        for item in pantry_items:
            all_ingredients.add(f"{item.name} ({item.quantity} {item.unit})")
        
        # Create a prompt with simpler preferences format
        prompt = f"""Create recipes using these ingredients:\n
        Available ingredients: {", ".join(all_ingredients)}\n"""
        
        if request.preferences:
            prompt += f"\nPreferences: {request.preferences}\n"
            
        return_type_prompt = """\nReturn recipes in JSON format with the following structure for each recipe:\n
        {
          'id': 'uuid',
          'name': 'string',
          'ingredients': ['string'],
          'instructions': ['string'],
          'preparation_time': 'number in minutes',
          'difficulty': 'easy|medium|hard'
        }"""
        prompt += return_type_prompt
        
        recipes_json = await claude_service.get_recipes(prompt)
        recipes_data = json.loads(recipes_json)
        
        # Convert the JSON data to Recipe objects
        recipes = []
        for recipe_data in recipes_data:
            # Replace the AI-generated ID with a proper UUID
            recipe_data['id'] = str(uuid.uuid4())
            # Add required fields if missing
            recipe_data['created_at'] = datetime.now()
            recipe_data['updated_at'] = datetime.now()
            recipe_data['is_saved'] = False
            recipes.append(Recipe(**recipe_data))
            
        recipe_manager.store_generated_recipes(recipes)
        return recipes
        
    except Exception as e:
        logger.error(f"Recipe generation error: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to generate recipes: {str(e)}")

@router.post("/save/{recipe_id}", response_model=RecipeResponse)
async def save_recipe(recipe_id: UUID):
    try:
        # Get the recipe from generated recipes
        recipe = recipe_manager.get_generated_recipe(recipe_id)
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
            
        # Save it to the database
        saved_recipe = recipe_manager.save_recipe(recipe)
        return saved_recipe
        
    except Exception as e:
        logger.error(f"Recipe save error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save recipe: {str(e)}"
        )

@router.get("/generated/{recipe_id}", response_model=RecipeResponse)
async def get_generated_recipe(recipe_id: UUID):
    recipe = recipe_manager.get_generated_recipe(recipe_id)
    if not recipe:
        raise HTTPException(status_code=404, detail="Recipe not found")
    return recipe

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
