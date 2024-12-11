# Standard library imports
import logging
import os
from typing import Dict

from jose import jwt, JWTError

# Third-party imports
from fastapi import HTTPException, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)
security = HTTPBearer()

def decode_jwt(token: str) -> Dict:
    try:
        # Use your Supabase JWT secret to verify tokens
        jwt_secret = os.getenv('SUPABASE_JWT_SECRET')
        if not jwt_secret:
            raise ValueError("JWT secret not configured")
            
        decoded = jwt.decode(
            token,
            jwt_secret,
            algorithms=["HS256"],
            audience="authenticated"
        )
        return decoded
    except JWTError as e:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid token: {str(e)}"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    try:
        token = credentials.credentials
        claims = decode_jwt(token)
        
        user_id = claims.get('sub')
        if not user_id:
            raise ValueError("No user ID in token")
            
        return {"id": user_id}
        
    except Exception as e:
        logger.error(f"Authentication error: {str(e)}")
        raise HTTPException(status_code=401, detail=str(e))

