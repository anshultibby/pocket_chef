from typing import TypeVar, Generic, List, Type
from pydantic import BaseModel
import json
import logging

T = TypeVar('T', bound=BaseModel)

class StructuredResponse(Generic[T]):
    """Helper class to handle structured data extraction from Claude responses"""
    
    def __init__(self, model_class: Type[T]):
        self.model_class = model_class
        self.logger = logging.getLogger(__name__)

    def parse(self, content: str) -> T | List[T]:
        """Parse Claude's response into a Pydantic model"""
        try:
            cleaned = self._clean_json(content)
            data = json.loads(cleaned)
            
            if isinstance(data, list):
                return [self.model_class.model_validate(item) for item in data]
            return self.model_class.model_validate(data)
            
        except Exception as e:
            self.logger.error(f"Parse error: {str(e)}")
            self.logger.error(f"Content: {content}")
            raise

    def _clean_json(self, content: str) -> str:
        """Extract JSON from Claude's response"""
        try:
            # Find JSON content (either array or object)
            start = content.find('[') if '[]' in content else content.find('{')
            end = content.rfind(']') if ']' in content else content.rfind('}')
            
            if start == -1 or end == -1:
                raise ValueError("No JSON found in response")
                
            content = content[start:end + 1]
            json.loads(content)  # Validate JSON
            return content
            
        except Exception as e:
            self.logger.error(f"Clean error: {str(e)}")
            raise
