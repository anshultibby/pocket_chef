import logging
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..models.recipe_interactions import (
    InteractionType,
    RecipeInteraction,
    RecipeInteractionCreate,
    RecipeInteractionResponse,
)
from ..models.recipes import RecipePreferences, RecipeResponse
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
        logger.debug(f"Generating recipes with preferences: {preferences}")
        recipe = await recipe_manager.generate_recipe(
            preferences=preferences,
            user_id=user_id,
        )
        return recipe
    except Exception as e:
        logger.error(f"Recipe generation error: {str(e)}", exc_info=True)
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
    """Get all recipes for the current user"""
    try:
        user_id = UUID(current_user["id"])
        return await recipe_manager.get_all_recipes(user_id)
    except Exception as e:
        logger.error(f"Error getting recipes: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{recipe_id}/interact")
async def create_recipe_interaction(
    recipe_id: str,
    interaction: RecipeInteractionCreate,
    current_user: dict = Depends(get_current_user),
) -> RecipeInteraction:
    return await recipe_manager.create_interaction(
        user_id=UUID(current_user["id"]),
        recipe_id=UUID(recipe_id),
        interaction=interaction,
    )


@router.get("/{recipe_id}/interactions")
async def get_recipe_interactions(
    recipe_id: str,
    interaction_type: Optional[InteractionType] = None,
    current_user: dict = Depends(get_current_user),
) -> List[RecipeInteraction]:
    return await recipe_manager.get_recipe_interactions(
        user_id=UUID(current_user["id"]),
        recipe_id=UUID(recipe_id),
        interaction_type=interaction_type,
    )


@router.get("/interactions")
async def get_all_interactions(
    interaction_type: Optional[InteractionType] = None,
    current_user: dict = Depends(get_current_user),
) -> List[RecipeInteractionResponse]:
    """Get all interactions with their associated recipes"""
    try:
        query = (
            recipe_manager.recipe_crud.supabase.table("recipe_interactions")
            .select("*, recipes(*)")
            .eq("user_id", str(current_user["id"]))
        )

        if interaction_type:
            query = query.eq("type", interaction_type)

        result = query.execute()

        interactions = []
        for item in result.data:
            if item.get("recipes"):
                recipe_data = item.pop("recipes")
                interaction_data = {
                    **item,
                    "recipe": recipe_data,  # The recipe data will be validated through RecipeResponse
                }
                interactions.append(RecipeInteractionResponse(**interaction_data))

        return interactions

    except Exception as e:
        logger.error(f"Error getting interactions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
