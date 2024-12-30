from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..models.feedback import FeedbackCreate, FeedbackResponse
from ..services.auth import get_current_user
from ..services.feedback_manager import FeedbackManager

router = APIRouter(prefix="/feedback", tags=["feedback"])


def get_feedback_manager():
    return FeedbackManager()


@router.post("", response_model=FeedbackResponse)
async def submit_feedback(
    feedback: FeedbackCreate,
    current_user: dict = Depends(get_current_user),
    feedback_manager: FeedbackManager = Depends(get_feedback_manager),
):
    """Submit user feedback"""
    try:
        return await feedback_manager.submit_feedback(
            UUID(current_user["id"]), feedback
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("", response_model=List[FeedbackResponse])
async def get_user_feedback(
    current_user: dict = Depends(get_current_user),
    feedback_manager: FeedbackManager = Depends(get_feedback_manager),
):
    """Get feedback history for current user"""
    try:
        return await feedback_manager.get_user_feedback(UUID(current_user["id"]))
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
