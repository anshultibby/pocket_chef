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
        # Get raw response from Claude
        raw_response = await claude_service.generate_recipes(
            ingredients=request.ingredients,
            preferences=request.preferences
        )
        logger.info(f"Claude service response: {raw_response}")
        
        # Parse response and create recipes
        user_id = UUID(current_user['id'])
        recipe_creates = recipe_manager.parse_recipe_response(raw_response)
        logger.info(f"Parsed recipes: {recipe_creates}")
        
        # Store the generated recipes and return the stored versions
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
