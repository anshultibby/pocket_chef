import logging
from typing import Optional
from uuid import UUID

from db.supabase import get_supabase
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from supabase.client import Client

logger = logging.getLogger(__name__)
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> UUID:
    """Validate the JWT token and return the user ID."""
    try:
        token = credentials.credentials
        supabase: Client = get_supabase()
        
        # Validate the token and extract user information
        response = supabase.auth.get_user(token)
        user = response.user
        
        if not user:
            logger.error("No user found in token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        
        return UUID(user.id)
        
    except Exception as e:
        logger.error(f"Token validation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

