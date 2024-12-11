import json
import logging
import uuid
from datetime import datetime
from typing import Dict, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..models.recipes import Recipe, RecipeCreate, RecipeGenerateRequest, RecipeResponse
from ..services.auth import get_current_user
from ..services.claude_service import ClaudeService
from ..services.pantry import get_pantry_manager
from ..services.recipe_manager import get_recipe_manager

router = APIRouter()
logger = logging.getLogger(__name__)
claude_service = ClaudeService()
recipe_manager = get_recipe_manager()
pantry_manager = get_pantry_manager()

@router.post("/generate", response_model=List[Recipe])
async def generate_recipes(
    request: RecipeGenerateRequest,
    current_user: dict = Depends(get_current_user)
):
    try:
        recipes = await claude_service.generate_recipes(
            ingredients=request.ingredients,
            preferences=request.preferences
        )
        
        recipe_manager.store_generated_recipes(
            recipes=recipes,
            user_id=UUID(current_user['id'])
        )
        
        return recipes
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/generated/{recipe_id}", response_model=Recipe)
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

@router.post("/save/{recipe_id}", response_model=Recipe)
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

@router.get("/saved", response_model=List[Recipe])
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
