from pydantic import BaseModel
from typing import List, Optional

class Item(BaseModel):
    name: str
    price: float = 0
    quantity: str = "1"
    shelf_life_days: int = 7

    @classmethod
    def from_string(cls, item_str: str):
        """Create an Item from a string representation"""
        return cls(name=item_str.strip())

    @classmethod
    def from_input(cls, data: dict) -> "Item":
        # Convert numeric quantities to strings
        if isinstance(data.get('quantity'), (int, float)):
            data['quantity'] = str(data['quantity'])
        
        # Ensure required fields exist
        data.setdefault('price', 0)
        data.setdefault('quantity', "1")
        data.setdefault('shelf_life_days', 7)
        
        return cls(**data)

class NutritionalAnalysis(BaseModel):
    calories_per_serving: int
    protein_g: float
    carbs_g: float
    fats_g: float
    key_nutrients: List[str]
    health_rating: int

class Meal(BaseModel):
    name: str
    ingredients: List[str]
    instructions: List[str]
    nutritional_analysis: Optional[NutritionalAnalysis] = None
    servings: int = 2

class MealPlan(BaseModel):
    meals: List[Meal]
    days: int
    people: int

class WastedIngredient(BaseModel):
    name: str
    cost: float
    reason: str
    expiry_date: str

class WasteAnalysis(BaseModel):
    wasted_ingredients: List[WastedIngredient]
    total_potential_savings: float

class ReceiptToMeals(BaseModel):
    ingredients: List[Item]
    meal_plan: MealPlan
    waste_analysis: Optional[WasteAnalysis]
    nutritional_analyses: Optional[List[dict]] = None
    total_people: int = 2

class RecipeIngredient(BaseModel):
    name: str
    amount: str
    unit: str

class Recipe(BaseModel):
    name: str
    ingredients: List[str]
    instructions: List[str]

class RecipeList(BaseModel):
    recipes: List[Recipe]

class RecipeJudgment(BaseModel):
    taste_score: int
    nutrition_score: int
    cost_efficiency: int
    reasoning: str

class ScratchpadUpdate(BaseModel):
    used_ingredients: List[str]
    remaining_ingredients: List[str]

class ShoppingListResponse(BaseModel):
    shopping_list: dict
    nutritional_analysis: List[dict]
