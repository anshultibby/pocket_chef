from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field


class FeedbackCreate(BaseModel):
    content: str = Field(..., description="The feedback content")
    category: str = Field(default="general", description="Category of feedback")
    rating: Optional[int] = Field(None, ge=1, le=5, description="Optional rating")


class FeedbackResponse(BaseModel):
    id: UUID
    user_id: UUID
    type: str = "feedback"
    data: dict
    metadata: dict = {}
    created_at: datetime
    updated_at: datetime

    @property
    def content(self) -> str:
        return self.data.get("content", "")

    @property
    def category(self) -> str:
        return self.data.get("category", "general")

    @property
    def rating(self) -> Optional[int]:
        return self.data.get("rating")
