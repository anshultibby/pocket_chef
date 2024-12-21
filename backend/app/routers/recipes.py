import json
import logging
import uuid
from datetime import datetime
from typing import Dict, Final, List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..models.recipes import (
    RecipeGenerateRequest,
    RecipeResponse,
    RecipeWithAvailability,
)
from ..services.auth import get_current_user
from ..services.claude import ClaudeService
from ..services.pantry import get_pantry_manager
from ..services.recipe_manager import get_recipe_manager

router = APIRouter(prefix="/recipes", tags=["recipes"])
logger = logging.getLogger(__name__)
recipe_manager = get_recipe_manager()
pantry_manager = get_pantry_manager()

DEFAULT_CATEGORY_REQUIREMENTS: Final[Dict[str, int]] = {
    "breakfast": 3,
    "lunch": 3,
    "dinner": 3,
    "snack": 2,
}


@router.post("/generate", response_model=List[RecipeResponse])
async def generate_recipes(
    request: RecipeGenerateRequest, current_user: dict = Depends(get_current_user)
):
    logger.info(f"Received generate request: {request}")
    try:
        user_id = UUID(current_user["id"])

        # Get user's pantry ingredients
        pantry_items = pantry_manager.get_items(user_id)
        ingredients = [item.name for item in pantry_items]

        # Generate preferences string based on categories
        preferences = "Generate exactly these recipes:\n" + "\n".join(
            f"- {req.count} {req.category} recipes" for req in request.categories
        )

        # Get raw response from Claude
        raw_response = await recipe_manager.claude_service.generate_recipes(
            ingredients=ingredients, preferences=preferences
        )

        # Parse and store recipes
        recipe_creates = recipe_manager.parse_recipe_response(raw_response)
        stored_recipes = recipe_manager.store_generated_recipes(
            recipes=recipe_creates, user_id=user_id
        )

        return stored_recipes
    except Exception as e:
        logger.error(f"Error generating recipes: {str(e)}")
        logger.exception("Full traceback:")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/generated/{recipe_id}", response_model=RecipeResponse)
async def get_generated_recipe(
    recipe_id: str, current_user: dict = Depends(get_current_user)
):
    try:
        recipe = recipe_manager.get_generated_recipe(
            recipe_id=recipe_id, user_id=UUID(current_user["id"])
        )
        if not recipe:
            raise HTTPException(status_code=404, detail="Recipe not found")
        return recipe
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/save/{recipe_id}", response_model=RecipeResponse)
async def save_recipe(recipe_id: str, current_user: dict = Depends(get_current_user)):
    try:
        return recipe_manager.save_recipe(
            recipe_id=recipe_id, user_id=UUID(current_user["id"])
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/saved", response_model=List[RecipeWithAvailability])
async def get_saved_recipes(current_user: dict = Depends(get_current_user)):
    """Get saved recipes with availability information"""
    try:
        return recipe_manager.get_saved_recipes_with_availability(
            user_id=UUID(current_user["id"])
        )
    except Exception as e:
        logger.error(f"Error getting saved recipes: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/saved/{recipe_id}")
async def delete_saved_recipe(
    recipe_id: str, current_user: dict = Depends(get_current_user)
):
    try:
        if not recipe_manager.delete_saved_recipe(
            recipe_id=recipe_id, user_id=UUID(current_user["id"])
        ):
            raise HTTPException(status_code=404, detail="Recipe not found")
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/by-category", response_model=Dict[str, List[RecipeResponse]])
async def get_recipes_by_category(
    current_user: dict = Depends(get_current_user), include_suggestions: bool = False
):
    try:
        user_id = UUID(current_user["id"])

        # Get existing recipes first
        existing_recipes = recipe_manager.get_recipes_by_categories(
            user_id=user_id, min_per_category=DEFAULT_CATEGORY_REQUIREMENTS
        )

        if not include_suggestions:
            return existing_recipes

        # Generate additional recipes if needed
        missing_recipes = {}
        for category, min_count in DEFAULT_CATEGORY_REQUIREMENTS.items():
            existing_count = len(existing_recipes.get(category, []))
            if existing_count < min_count:
                missing_recipes[category] = min_count - existing_count

        if missing_recipes:
            # Get user's pantry ingredients
            pantry_items = pantry_manager.get_items(user_id)
            ingredients = [item.name for item in pantry_items]

            # Generate missing recipes
            new_recipes = await recipe_manager.generate_recipes_for_categories(
                user_id=user_id,
                categories_to_generate=[
                    {"category": cat, "count": count}
                    for cat, count in missing_recipes.items()
                ],
                ingredients=ingredients,
            )

            # Merge new recipes with existing ones
            for recipe in new_recipes:
                category = recipe.data["category"]
                if category not in existing_recipes:
                    existing_recipes[category] = []
                existing_recipes[category].append(recipe)

        return existing_recipes

    except Exception as e:
        logger.error(f"Error getting recipes by category: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/existing", response_model=Dict[str, List[RecipeResponse]])
async def get_existing_recipes(current_user: dict = Depends(get_current_user)):
    try:
        return recipe_manager.get_recipes_by_categories(
            user_id=UUID(current_user["id"]),
            min_per_category={"breakfast": 3, "lunch": 3, "dinner": 3, "snack": 2},
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/suggestions", response_model=Dict[str, List[RecipeResponse]])
async def get_recipe_suggestions(current_user: dict = Depends(get_current_user)):
    """Get recipe suggestions by category"""
    try:
        min_requirements = {"breakfast": 3, "lunch": 3, "dinner": 3, "snack": 2}

        return await recipe_manager.get_recipes_by_category(
            user_id=UUID(current_user["id"]), min_per_category=min_requirements
        )
    except Exception as e:
        logger.error(f"Error getting recipe suggestions: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
