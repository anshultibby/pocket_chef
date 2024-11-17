RECIPE_TOOLS = [{
    "name": "suggest_recipe",
    "description": "Suggest a recipe using available ingredients",
    "input_schema": {
        "type": "object",
        "properties": {
            "name": {"type": "string", "description": "Name of the recipe"},
            "ingredients": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "name": {"type": "string"},
                        "amount": {"type": "string"},
                        "unit": {"type": "string"}
                    },
                    "required": ["name", "amount", "unit"]
                }
            },
            "instructions": {
                "type": "array",
                "items": {"type": "string"}
            },
            "estimated_time": {"type": "integer", "description": "Estimated cooking time in minutes"}
        },
        "required": ["name", "ingredients", "instructions", "estimated_time"]
    }
}, {
    "name": "judge_recipe",
    "description": "Evaluate a recipe based on taste, nutrition, and cost",
    "input_schema": {
        "type": "object",
        "properties": {
            "taste_score": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10,
                "description": "Rating of expected taste (1-10)"
            },
            "nutrition_score": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10,
                "description": "Rating of nutritional value (1-10)"
            },
            "cost_efficiency": {
                "type": "integer",
                "minimum": 1,
                "maximum": 10,
                "description": "Rating of cost effectiveness (1-10)"
            },
            "reasoning": {"type": "string", "description": "Explanation for the scores"}
        },
        "required": ["taste_score", "nutrition_score", "cost_efficiency", "reasoning"]
    }
}, {
    "name": "update_scratchpad",
    "description": "Remove used ingredients from scratchpad",
    "input_schema": {
        "type": "object",
        "properties": {
            "used_ingredients": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Names of ingredients to remove"
            },
            "remaining_ingredients": {
                "type": "array",
                "items": {"type": "string"},
                "description": "Names of ingredients still available"
            }
        },
        "required": ["used_ingredients", "remaining_ingredients"]
    }
}]