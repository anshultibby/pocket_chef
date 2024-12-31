import json
import logging
from typing import List, Type, TypeVar, Union

from pydantic import BaseModel

logger = logging.getLogger(__name__)
T = TypeVar("T", bound=BaseModel)


def parse_claude_response(content: str, model_class: Type[T]) -> Union[T, List[T]]:
    """Parse Claude's response into a Pydantic model"""
    # Try to find JSON content by looking for common patterns
    json_patterns = [
        (content.find("{"), content.rfind("}")),  # Object pattern
        (content.find("["), content.rfind("]")),  # Array pattern
    ]

    # Try each pattern and use the one that yields valid JSON
    for start, end in json_patterns:
        if start != -1 and end != -1:
            try:
                json_str = content[start : end + 1]
                data = json.loads(json_str)
                return (
                    [model_class(**item) for item in data]
                    if isinstance(data, list)
                    else model_class(**data)
                )
            except json.JSONDecodeError:
                continue

    raise ValueError("No valid JSON found in response")
