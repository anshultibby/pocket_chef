import logging
from datetime import datetime
from typing import List, Optional, Type, TypeVar, Union
from uuid import UUID

from anthropic import AsyncAnthropic
from pydantic import BaseModel

from ...base import BaseLLMService
from .handlers import parse_claude_response
from .prompts import (
    INGREDIENT_ANALYSIS_PROMPT_TEMPLATE,
    MAX_TOKENS,
    MODEL,
    RECIPE_GENERATION_PROMPT_TEMPLATE,
)

logger = logging.getLogger(__name__)

T = TypeVar("T", bound=BaseModel)


class ClaudeService(BaseLLMService):
    def __init__(self):
        super().__init__()
        self.client = AsyncAnthropic()

    async def parse_ingredient_text(
        self,
        model: Type[T],
        ingredient: str,
        user_id: Optional[UUID] = None,
        use_cache: bool = True,
    ) -> T:
        """Parse and standardize items from receipt text"""
        today = datetime.now().strftime("%Y-%m-%d")
        return await self.process_request(
            prompt_template=INGREDIENT_ANALYSIS_PROMPT_TEMPLATE,
            model=model,
            template_vars={"ingredients": ingredient, "today": today},
            user_id=user_id,
            use_cache=use_cache,
            metadata={"type": "ingredient_analysis"},
        )

    async def parse_receipt_text(
        self,
        model: Type[T],
        receipt_text: str,
        user_id: Optional[UUID] = None,
        use_cache: bool = True,
    ) -> T:
        """Parse receipt text and return list of PantryItemCreate"""
        return await self.process_request(
            prompt_template=INGREDIENT_ANALYSIS_PROMPT_TEMPLATE,
            model=model,
            template_vars={"ingredients": receipt_text},
            user_id=user_id,
            use_cache=use_cache,
            metadata={"type": "receipt_analysis"},
        )

    async def generate_recipes(
        self,
        model: Type[T],
        ingredients: List[str],
        preferences: str,
        user_id: Optional[UUID] = None,
        use_cache: bool = True,
    ) -> List[T]:
        """Generate recipes using structured prompt"""
        ingredients_text = "\n".join(f"- {item}" for item in ingredients)

        return await self.process_request(
            prompt_template=RECIPE_GENERATION_PROMPT_TEMPLATE,
            model=model,
            template_vars={
                "ingredients": ingredients_text,
                "preferences": preferences,
            },
            system_prompt=None,
            user_id=user_id,
            use_cache=use_cache,
            metadata={"type": "recipe_generation"},
        )

    async def _generate_response(
        self,
        prompt: str,
        response_model: Type[T],
        system_prompt: Optional[str] = None,
        **kwargs,
    ) -> Union[T, List[T]]:
        """Implementation of abstract method from BaseLLMService"""
        messages = [{"role": "user", "content": prompt}]

        # Create the request parameters
        create_params = {
            "model": MODEL,
            "max_tokens": MAX_TOKENS,
            "messages": messages,
        }

        # Add system parameter if provided
        if system_prompt:
            create_params["system"] = system_prompt

        logger.info(f"Claude request: {create_params}")
        response = await self.client.messages.create(**create_params)
        logger.info(f"Claude response: {response.content[0].text}")

        return parse_claude_response(response.content[0].text, response_model)
