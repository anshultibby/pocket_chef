import logging
from typing import Generic, List, Type, TypeVar
from uuid import UUID

from pydantic import BaseModel

from ..db.crud import UserContentCRUD

T = TypeVar("T", bound=BaseModel)
logger = logging.getLogger(__name__)


class UserContentManager(Generic[T]):
    def __init__(self, content_type: str, response_model: Type[T]):
        self.content_crud = UserContentCRUD()
        self.content_type = content_type
        self.response_model = response_model

    async def create_content(
        self, user_id: UUID, data: BaseModel, metadata: dict = {}
    ) -> T:
        try:
            content = await self.content_crud.create_content(
                user_id=user_id,
                type=self.content_type,
                data=data.dict(exclude_unset=True),  # Only include set values
                metadata=metadata,
            )
            logger.info(f"Created {self.content_type} content for user {user_id}")
            return self.response_model(**content)
        except Exception as e:
            logger.error(f"Error creating {self.content_type} content: {str(e)}")
            raise

    async def get_user_content(self, user_id: UUID) -> List[T]:
        try:
            items = await self.content_crud.get_user_content(
                user_id=user_id, type=self.content_type
            )
            logger.info(
                f"Retrieved {len(items)} {self.content_type} items for user {user_id}"
            )
            return [self.response_model(**item) for item in items]
        except Exception as e:
            logger.error(f"Error getting user {self.content_type} content: {str(e)}")
            raise

    async def update_content(
        self, content_id: UUID, user_id: UUID, data: BaseModel
    ) -> T:
        try:
            content = await self.content_crud.update_content(
                content_id=content_id, user_id=user_id, data=data.dict()
            )
            logger.info(
                f"Updated {self.content_type} content {content_id} for user {user_id}"
            )
            return self.response_model(**content)
        except Exception as e:
            logger.error(f"Error updating {self.content_type} content: {str(e)}")
            raise

    async def delete_content(self, content_id: UUID, user_id: UUID) -> None:
        try:
            await self.content_crud.delete_content(
                content_id=content_id, user_id=user_id
            )
            logger.info(
                f"Deleted {self.content_type} content {content_id} for user {user_id}"
            )
        except Exception as e:
            logger.error(f"Error deleting {self.content_type} content: {str(e)}")
            raise
