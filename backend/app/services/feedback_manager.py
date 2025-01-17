from typing import List
from uuid import UUID

from ..models.feedback import FeedbackCreate, FeedbackResponse
from .user_content_manager import UserContentManager


class FeedbackManager(UserContentManager[FeedbackResponse]):
    def __init__(self):
        super().__init__(content_type="feedback", response_model=FeedbackResponse)

    async def submit_feedback(
        self, user_id: UUID, feedback: FeedbackCreate
    ) -> FeedbackResponse:
        return await self.create_content(user_id=user_id, data=feedback, metadata={})

    async def get_user_feedback(self, user_id: UUID) -> List[FeedbackResponse]:
        return await self.get_user_content(user_id)
