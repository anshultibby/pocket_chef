import logging
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..models.recipes import (
    RecipePreferences,
    RecipeResponse,
    RecipeUsage,
    RecipeUsageCreate,
)
from ..services.auth import get_current_user
from ..services.pantry import get_pantry_manager
from ..services.recipe_manager import get_recipe_manager

router = APIRouter(prefix="/recipes", tags=["recipes"])
logger = logging.getLogger(__name__)

recipe_manager = get_recipe_manager()
pantry_manager = get_pantry_manager()


@router.post("/generate")
async def generate_recipes(
    preferences: RecipePreferences, current_user: dict = Depends(get_current_user)
):
    """Generate raw recipes based on preferences"""
    try:
        user_id = UUID(current_user["id"])
        recipe = await recipe_manager.generate_recipe(
            preferences=preferences,
            user_id=user_id,
        )
        return recipe
    except Exception as e:
        logger.error(f"Recipe generation error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{recipe_id}/link-ingredients")
async def link_recipe_ingredients(
    recipe_id: str, current_user: dict = Depends(get_current_user)
):
    """Link recipe ingredients with pantry items"""
    try:
        user_id = UUID(current_user["id"])
        return await recipe_manager.link_recipe_ingredients(recipe_id, user_id)
    except Exception as e:
        logger.error(f"Ingredient linking error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/", response_model=List[RecipeResponse])
async def get_recipes(current_user: dict = Depends(get_current_user)):
    """Get recipes with availability information"""
    return recipe_manager.get_saved_recipes_with_availability(
        user_id=UUID(current_user["id"])
    )


@router.post("/{recipe_id}/use", response_model=RecipeUsage)
async def use_recipe(
    recipe_id: str,
    usage: RecipeUsageCreate,
    current_user: dict = Depends(get_current_user),
):
    """Record recipe usage and update pantry quantities"""
    try:
        user_id = UUID(current_user["id"])
        return await recipe_manager.use_recipe(
            recipe_id=recipe_id, user_id=user_id, usage=usage
        )
    except Exception as e:
        logger.error(f"Error using recipe: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
