import logging
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional, Type, TypeVar, Union
from uuid import UUID

from pydantic import BaseModel

from .llm_cache import LLMCache
from .schema_utils import summarize_schema

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


class BaseLLMService(ABC):
    def __init__(self):
        self.cache = LLMCache()

    @abstractmethod
    async def _generate_response(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        **kwargs,
    ) -> Union[T, List[T]]:
        """Implementation-specific response generation"""
        pass

    async def process_request(
        self,
        prompt_template: str,
        model: Type[T],
        template_vars: Dict[str, Any],
        system_prompt: Optional[str] = None,
        user_id: Optional[UUID] = None,
        use_cache: bool = True,
        include_schema: bool = True,
        metadata: Optional[Dict] = None,
    ) -> Union[T, List[T]]:
        """
        Process a request with schema handling and templating
        """
        # Add schema to template variables if needed
        if include_schema:
            template_vars["model"] = summarize_schema(model.model_json_schema())

        # Generate prompt from template
        prompt = prompt_template.substitute(**template_vars)
        logger.info(f"Generated prompt: {prompt}")
        # Generate or get cached response
        response = await self.generate(
            prompt=prompt,
            response_model=model,
            system_prompt=system_prompt,
            user_id=user_id,
            use_cache=use_cache,
            metadata=metadata,
        )
        logger.info(f"Generated response: {response}")
        return response

    async def generate(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        user_id: Optional[UUID] = None,
        use_cache: bool = True,
        **kwargs,
    ) -> Union[T, List[T]]:
        """Generate response with caching layer"""
        if use_cache:
            cached_response = await self.cache.get_cached_response(
                prompt=prompt,
                system_prompt=system_prompt,
                response_model=response_model,
            )
            if cached_response:
                return response_model.model_validate(cached_response)

        # Generate new response
        response = await self._generate_response(
            prompt=prompt,
            response_model=response_model,
            system_prompt=system_prompt,
            **kwargs,
        )

        # Cache the response if user_id is provided
        if user_id and use_cache:
            await self.cache.cache_response(
                prompt=prompt,
                response=response.model_dump(),
                user_id=user_id,
                system_prompt=system_prompt,
                response_model=response_model,
                metadata=kwargs.get("metadata"),
            )

        return response
