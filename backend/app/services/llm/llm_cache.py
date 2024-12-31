import logging
from datetime import datetime
from typing import Any, Dict, Optional, Type
from uuid import UUID

from pydantic import BaseModel

from ...db.crud import UserContentCRUD

logger = logging.getLogger(__name__)


class LLMCache:
    def __init__(self):
        self.user_content = UserContentCRUD()

    async def get_cached_response(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        response_model: Optional[Type[BaseModel]] = None,
    ) -> Optional[Dict[str, Any]]:
        """Try to get a cached response for the given prompt"""
        try:
            # Query recent cached responses without metadata filtering
            cached = await self.user_content.get_user_content(
                user_id=None, type="llm_cache", limit=1
            )

            if cached and len(cached) > 0:
                # Check metadata match manually
                cache_key = {
                    "prompt": prompt,
                    "system_prompt": system_prompt,
                    "model": response_model.__name__ if response_model else None,
                }
                if cached[0].get("metadata") == cache_key:
                    return cached[0]["data"]["response"]

            return None
        except Exception as e:
            logger.error(f"Error retrieving cached response: {str(e)}")
            return None

    async def cache_response(
        self,
        prompt: str,
        response: Any,
        user_id: Optional[UUID] = None,
        system_prompt: Optional[str] = None,
        response_model: Optional[Type[BaseModel]] = None,
        metadata: Optional[Dict] = None,
    ) -> None:
        """Cache an LLM response"""
        try:
            logger.info(f"Caching response for user {user_id}")
            # Create cache metadata
            cache_metadata = {
                "prompt": prompt,
                "system_prompt": system_prompt,
                "model": response_model.__name__ if response_model else None,
                "timestamp": datetime.utcnow().isoformat(),
                **(metadata or {}),
            }

            # Store in user_content table
            result = await self.user_content.create_content(
                user_id=user_id,
                type="llm_cache",
                data={"response": response},
                metadata=cache_metadata,
            )
            logger.debug(f"Cache entry created: {result}")

        except Exception as e:
            logger.error(f"Error caching response: {str(e)}", exc_info=True)
            # If caching fails, we can safely ignore it
            pass
