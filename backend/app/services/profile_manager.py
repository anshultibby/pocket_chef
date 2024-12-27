from uuid import UUID
from app.db.crud import ProfileCRUD
from app.models.user_profile import UserProfile, UserProfileUpdate


class ProfileManager:
    def __init__(self):
        self.profile_crud = ProfileCRUD()

    async def get_profile(self, user_id: UUID) -> UserProfile:
        """Get a user's profile, creating it if it doesn't exist"""
        profile = await self.profile_crud.get_profile(user_id)
        if not profile:
            profile = await self.profile_crud.create_profile(user_id)
        return profile

    async def update_profile(
        self, user_id: UUID, updates: UserProfileUpdate
    ) -> UserProfile:
        """Update a user's profile"""
        return await self.profile_crud.update_profile(user_id, updates)
