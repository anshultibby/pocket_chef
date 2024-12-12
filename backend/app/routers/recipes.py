import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..models.recipes import RecipeCreate, RecipeGenerateRequest, RecipeResponse
from ..services.auth import get_current_user
from ..services.claude_service import ClaudeService
from ..services.pantry import get_pantry_manager
from ..services.recipe_manager import get_recipe_manager

router = APIRouter(prefix="/recipes", tags=["recipes"])
logger = logging.getLogger(__name__)
claude_service = ClaudeService()
recipe_manager = get_recipe_manager()
pantry_manager = get_pantry_manager()

@router.post("/generate", response_model=List[RecipeResponse])
async def generate_recipes(
    request: RecipeGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    logger.info(f"Received generate request: {request}")
    try:
        user_id = UUID(current_user['id'])
        
        # Get user's pantry ingredients
        pantry_items = pantry_manager.get_items(user_id)
        ingredients = [item.name for item in pantry_items]
        
        # Generate preferences string based on categories
        preferences = "Generate exactly these recipes:\n" + "\n".join(
            f"- {req.count} {req.category} recipes" 
            for req in request.categories
        )
        
        # Get raw response from Claude
        raw_response = await recipe_manager.claude_service.generate_recipes(
            ingredients=ingredients,
            preferences=preferences
        )
        
        # Parse and store recipes
        recipe_creates = recipe_manager.parse_recipe_response(raw_response)
        stored_recipes = recipe_manager.store_generated_recipes(
            recipes=recipe_creates, 
            user_id=user_id
        )
        
        return stored_recipes
    except Exception as e:
        logger.error(f"Error generating recipes: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/generated/{recipe_id}", response_model=RecipeResponse)
async def get_generated_recipe(
    recipe_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        recipe = recipe_manager.get_generated_recipe(
            recipe_id=recipe_id,
            user_id=UUID(current_user['id'])
        )
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return recipe
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/save/{recipe_id}", response_model=RecipeResponse)
async def save_recipe(
    recipe_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        return recipe_manager.save_recipe(
            recipe_id=recipe_id,
            user_id=UUID(current_user['id'])
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/saved", response_model=List[RecipeResponse])
async def get_saved_recipes(current_user: dict = Depends(get_current_user)):
    try:
        return recipe_manager.get_saved_recipes(
            user_id=UUID(current_user['id'])
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/saved/{recipe_id}")
async def delete_saved_recipe(
    recipe_id: str,
    current_user: dict = Depends(get_current_user)
):
    try:
        if not recipe_manager.delete_saved_recipe(
            recipe_id=recipe_id,
            user_id=UUID(current_user['id'])
        ):
            raise HTTPException(status_code=404, detail="Recipe not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/by-category", response_model=Dict[str, List[RecipeResponse]])
async def get_recipes_by_category(
    current_user: dict = Depends(get_current_user)
):
    try:
        # Define minimum required recipes per category
        min_requirements = {
            "breakfast": 3,
            "lunch": 3,
            "dinner": 3,
            "snack": 2
        }
        
        user_id = UUID(current_user['id'])
        
        # Get existing recipes by category
        existing_recipes = recipe_manager.get_recipes_by_categories(
            user_id=user_id,
            min_per_category=min_requirements
        )
        
        return existing_recipes
        
    except Exception as e:
        logger.error(f"Error getting recipes by category: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/existing", response_model=Dict[str, List[RecipeResponse]])
async def get_existing_recipes(current_user: dict = Depends(get_current_user)):
    try:
        return recipe_manager.get_recipes_by_categories(
            user_id=UUID(current_user['id']),
            min_per_category={
                "breakfast": 3,
                "lunch": 3,
                "dinner": 3,
                "snack": 2
            }
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
