from uuid import UUID

from app.models.user_profile import UserProfile, UserProfileUpdate
from app.services.auth import get_current_user
from app.services.profile_manager import ProfileManager
from fastapi import APIRouter, Depends, HTTPException

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("", response_model=UserProfile)
async def get_profile(
    current_user: dict = Depends(get_current_user),
    profile_manager: ProfileManager = Depends(),
):
    """Get the current user's profile"""
    try:
        return await profile_manager.get_profile(UUID(current_user["id"]))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.patch("", response_model=UserProfile)
async def update_profile(
    updates: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    profile_manager: ProfileManager = Depends(),
):
    """Update the current user's profile, creating it if it doesn't exist"""
    try:
        # First try to get the profile
        profile = await profile_manager.get_profile(UUID(current_user["id"]))
        # Now update it
        return await profile_manager.update_profile(UUID(current_user["id"]), updates)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("", response_model=UserProfile)
async def create_profile(
    current_user: dict = Depends(get_current_user),
    profile_manager: ProfileManager = Depends(),
):
    """Create a new profile for the current user"""
    return await profile_manager.get_profile(UUID(current_user["id"]))
