from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException

from ..db.supabase import get_supabase
from ..services.auth import get_current_user

router = APIRouter()


@router.delete("/me")
async def delete_user_data(user_id: dict = Depends(get_current_user)):
    """Delete user account - all related data will be cascade deleted"""
    try:
        user_uuid = UUID(user_id["id"])
        supabase = get_supabase()

        # Delete the user from auth.users - this will cascade to all related data
        result = supabase.auth.admin.delete_user(str(user_uuid))

        return {"message": "User account deleted successfully"}
    except Exception as e:
        logger.error(f"Error deleting user account: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
