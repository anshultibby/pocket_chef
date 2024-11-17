from fastapi import FastAPI, UploadFile, File, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from .services import ocr_service, claude_service
from .models import schemas
from .models.schemas import Meal
from typing import List, Tuple
import json
import logging
from copy import deepcopy
from .config import RECIPE_TOOLS
from datetime import datetime, timedelta
from typing import Union, Any

# Add logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Receipt to Meal Planner",
    description="Upload a receipt image to get ingredients and meal suggestions",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

def extract_json_from_response(response: str, array: bool = False) -> str:
    """
    Extracts JSON from Claude's response text, handling both objects and arrays.
    
    Args:
        response: Raw response text from Claude
        array: If True, extract array []. If False, extract object {}.
    
    Returns:
        Cleaned JSON string
    
    Raises:
        ValueError: If no valid JSON structure is found
    """
    response = response.strip()
    start_char = '[' if array else '{'
    end_char = ']' if array else '}'
    
    start_idx = response.find(start_char)
    if start_idx == -1:
        raise ValueError(f"No {start_char} found in response")
        
    end_idx = response.rfind(end_char)
    if end_idx == -1:
        raise ValueError(f"No {end_char} found in response")
        
    return response[start_idx:end_idx + 1]

def parse_claude_response(response: str, array: bool = False) -> Union[dict, list]:
    """
    Extracts and parses JSON from Claude's response.
    
    Args:
        response: Raw response text from Claude
        array: If True, expect JSON array. If False, expect JSON object.
    
    Returns:
        Parsed JSON as dict or list
    """
    try:
        json_str = extract_json_from_response(response, array)
        return json.loads(json_str)
    except Exception as e:
        raise ValueError(f"Failed to parse Claude response: {str(e)}")

@app.post(
    "/receipt-to-meals",
    response_model=schemas.ReceiptToMeals,
    description="Upload a receipt or refrigerator image to get ingredients and meal suggestions"
)
async def receipt_to_meals(
    file: UploadFile = File(..., description="Receipt or refrigerator image (jpg, png)"),
    days: int = Query(default=3, description="Number of days to plan meals for"),
    people: int = Query(default=2, description="Number of people to plan meals for")
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, "File must be an image")
    
    logger.info(f"Processing image: {file.filename}")
    
    # Smart prompt that handles both types of images
    prompt = """Look at this image and:
    1. First determine if this is a receipt or an image of food items/refrigerator
    2. Then list all food items you can identify, including:
        - name (product name)
        - estimated quantity
        - estimated shelf life in days
        - estimated price (rough market value)

    For receipts: Extract the actual prices and items listed
    For fridge/food images: Estimate the quantities and prices of visible items

    Format as JSON array like:
    [
        {
            "name": "Milk",
            "price": 3.99,
            "quantity": 1,
            "shelf_life_days": 7
        }
    ]"""
    
    ingredients = await claude_service.extract_items(file, prompt)
    
    if not ingredients:
        raise HTTPException(400, "Could not extract any ingredients from the image")
    
    # Rest remains the same
    meal_plan, unused_ingredients = await generate_meal_plan(ingredients, days, people)
    nutritional_analyses = await analyze_meals_nutrition(meal_plan.meals)
    
    for meal, nutrition in zip(meal_plan.meals, nutritional_analyses):
        meal.nutritional_analysis = nutrition
    
    waste_analysis = calculate_waste_analysis(unused_ingredients, days)
    
    return schemas.ReceiptToMeals(
        ingredients=ingredients,
        meal_plan=meal_plan,
        waste_analysis=waste_analysis,
        nutritional_analysis=nutritional_analyses
    )

@app.post(
    "/shopping-list",
    response_model=schemas.ShoppingListResponse,
    description="Generate a shopping list from provided recipes"
)
async def generate_shopping_list(
    recipes: schemas.RecipeList
):
    # Get nutritional analysis for each recipe
    nutritional_analyses = await analyze_meals_nutrition(recipes.recipes)
    
    # Generate categorized shopping list
    shopping_list = await generate_categorized_shopping_list(recipes.recipes)
    
    return schemas.ShoppingListResponse(
        shopping_list=shopping_list,
        nutritional_analysis=nutritional_analyses
    )

# Helper functions
async def extract_ingredients_from_text(text: str) -> List[schemas.Item]:
    logger.info("=== Starting ingredient extraction ===")
    logger.info(f"Raw OCR text:\n{text}")
    
    ingredients_prompt = f"""Extract grocery items from this receipt. For each item, include:
- name (product name only)
- price (numeric value)
- quantity (default to 1)
- shelf_life_days (estimate: 7 for fresh, 90 for packaged, 180 for frozen)

Format as JSON array. Example:
[
    {{
        "name": "Rice Noodle Mushroom",
        "price": 0.99,
        "quantity": 1,
        "shelf_life_days": 90
    }}
]

Receipt text:
{text}"""
    
    try:
        logger.info("Calling Claude service for extraction...")
        ingredients = await claude_service.extract_items(text, ingredients_prompt)
        
        if not ingredients:
            logger.error("No ingredients extracted")
            raise HTTPException(400, "Could not extract any ingredients from the receipt")
        
        logger.info(f"Successfully extracted {len(ingredients)} ingredients")
        logger.info(f"Extracted ingredients: {ingredients}")
        return ingredients
        
    except Exception as e:
        logger.error(f"Failed to extract ingredients: {str(e)}")
        raise HTTPException(500, f"Failed to process receipt text: {str(e)}")

async def generate_meal_plan(ingredients: List[schemas.Item], days: int, people: int) -> Tuple[schemas.MealPlan, List[dict]]:
    available_ingredients = [item.dict() for item in deepcopy(ingredients)]
    
    recipe_prompt = f"""You are a meal planning expert. Create {days} practical recipes using these ingredients: {json.dumps(available_ingredients)}

    Requirements:
    1. Each recipe MUST use ingredients from the provided list (plus basic seasonings)
    2. Each recipe must feed {people} people
    3. Focus on realistic, everyday meals
    4. Use ingredient names EXACTLY as provided
    5. Include clear, step-by-step instructions
    
    IMPORTANT: Return ONLY a JSON array with NO additional text or explanation. Format:
    [
        {{
            "name": "Simple Pasta with Vegetables",
            "ingredients": [
                "Pasta",
                "Tomatoes",
                "Spinach"
            ],
            "instructions": [
                "Boil pasta according to package directions",
                "Sauté tomatoes until soft",
                "Add spinach and cook until wilted",
                "Combine pasta with vegetables"
            ],
            "servings": {people}
        }}
    ]"""
    
    try:
        recipes_json = await claude_service.get_completion(recipe_prompt)
        recipes_json = extract_json_from_response(recipes_json, array=True)
        recipes = json.loads(recipes_json)
        
        if not recipes or not isinstance(recipes, list) or len(recipes) != days:
            logger.error(f"Invalid recipe response: Expected {days} recipes, got {len(recipes) if recipes else 0}")
            raise ValueError("Invalid recipe generation response")
            
        # Validate each recipe has required fields
        for recipe in recipes:
            if not all(key in recipe for key in ['name', 'ingredients', 'instructions', 'servings']):
                logger.error(f"Invalid recipe format: {recipe}")
                raise ValueError("Recipe missing required fields")
            
            # Validate ingredients exist in available ingredients
            available_names = {item['name'].lower() for item in available_ingredients}
            for ingredient in recipe['ingredients']:
                if ingredient.lower() not in available_names:
                    logger.warning(f"Recipe '{recipe['name']}' uses unavailable ingredient: {ingredient}")

        meals = [
            Meal(
                name=recipe['name'],
                ingredients=recipe['ingredients'],
                instructions=recipe['instructions'],
                servings=people
            )
            for recipe in recipes
        ]
        
        # Single call to update remaining ingredients after all recipes
        update_prompt = f"""Given these ingredients used across meals: {json.dumps([recipe['ingredients'] for recipe in recipes])}
        And these available ingredients: {json.dumps(available_ingredients)}

        Return ONLY a JSON array of remaining unused ingredients with NO additional text or explanation. Format:
        [
            {{
                "name": "item name",
                "price": 0.00,
                "quantity": 1,
                "shelf_life_days": 7
            }}
        ]"""
        
        unused_json = await claude_service.get_completion(update_prompt)
        unused_json = extract_json_from_response(unused_json, array=True)
        unused_ingredients = json.loads(unused_json)
        
    except (json.JSONDecodeError, ValueError) as e:
        logger.error(f"First recipe generation attempt failed: {str(e)}")
        # Retry once with a simplified prompt
        try:
            simplified_prompt = f"""Create {days} simple recipes using ONLY these ingredients: {json.dumps([i['name'] for i in available_ingredients])}
            Return as JSON array. Each recipe needs: name, ingredients list, instructions list, servings: {people}"""
            
            recipes_json = await claude_service.get_completion(simplified_prompt)
            recipes = json.loads(recipes_json)
            
            if not recipes or not isinstance(recipes, list) or len(recipes) != days:
                logger.error(f"Invalid recipe response: Expected {days} recipes, got {len(recipes) if recipes else 0}")
                raise ValueError("Invalid recipe generation response")
                
            # Validate each recipe has required fields
            for recipe in recipes:
                if not all(key in recipe for key in ['name', 'ingredients', 'instructions', 'servings']):
                    logger.error(f"Invalid recipe format: {recipe}")
                    raise ValueError("Recipe missing required fields")
                
                # Validate ingredients exist in available ingredients
                available_names = {item['name'].lower() for item in available_ingredients}
                for ingredient in recipe['ingredients']:
                    if ingredient.lower() not in available_names:
                        logger.warning(f"Recipe '{recipe['name']}' uses unavailable ingredient: {ingredient}")

            meals = [
                Meal(
                    name=recipe['name'],
                    ingredients=recipe['ingredients'],
                    instructions=recipe['instructions'],
                    servings=people
                )
                for recipe in recipes
            ]
            
            # Single call to update remaining ingredients after all recipes
            update_prompt = f"""Given these ingredients used across meals: {json.dumps([recipe['ingredients'] for recipe in recipes])}
            And these available ingredients: {json.dumps(available_ingredients)}

            Return ONLY a JSON array of remaining unused ingredients with NO additional text or explanation. Format:
            [
                {{
                    "name": "item name",
                    "price": 0.00,
                    "quantity": 1,
                    "shelf_life_days": 7
                }}
            ]"""
            
            unused_json = await claude_service.get_completion(update_prompt)
            unused_json = extract_json_from_response(unused_json, array=True)
            unused_ingredients = json.loads(unused_json)
            
        except Exception as retry_error:
            logger.error(f"Retry failed: {str(retry_error)}")
            meals = []
            unused_ingredients = available_ingredients
    
    return schemas.MealPlan(
        meals=meals,
        days=days,
        people=people,
        meals_generated=len(meals)
    ), unused_ingredients

async def analyze_meals_nutrition(meals: List[schemas.Meal]) -> List[dict]:
    nutritional_analyses = []
    claude_calls = 0
    
    for meal in meals:
        meal_name = meal.name
        meal_ingredients = meal.ingredients
        
        nutrition_prompt = f"""Analyze the nutritional profile of this meal:
        Name: {meal_name}
        Ingredients: {', '.join(meal_ingredients)}
        
        Return ONLY a JSON object with NO additional text or explanation containing these fields:
        {{
            "calories_per_serving": int,
            "protein_g": float,
            "carbs_g": float,
            "fats_g": float,
            "key_nutrients": [list of strings],
            "health_rating": int (1-5)
        }}"""
        
        try:
            claude_calls += 1
            logger.info(f"Making Claude API call #{claude_calls} for nutritional analysis")
            nutrition_data = await claude_service.get_completion(nutrition_prompt)
            nutrition_data = extract_json_from_response(nutrition_data, array=False)
            
            logger.info(f"Received nutrition data for {meal_name}")
            nutritional_analyses.append(json.loads(nutrition_data))
        except Exception as e:
            logger.error(f"Failed to get nutritional analysis: {e}")
            nutritional_analyses.append({
                "calories_per_serving": 0,
                "protein_g": 0.0,
                "carbs_g": 0.0,
                "fats_g": 0.0,
                "key_nutrients": [],
                "health_rating": 1
            })
    
    logger.info(f"Total Claude API calls for nutrition analysis: {claude_calls}")
    return nutritional_analyses

async def generate_categorized_shopping_list(recipes: List[dict]) -> dict:
    shopping_list_prompt = f"""Based on these recipes:
    {json.dumps(recipes)}
    
    Create a consolidated shopping list that:
    1. Groups items by category (produce, meat, dairy, pantry, etc.)
    2. Includes estimated quantities needed
    3. Notes any basic pantry staples that might be needed
    
    Return as JSON with categories as keys and arrays of items as values."""

    try:
        shopping_list = await claude_service.get_completion(shopping_list_prompt)
        shopping_list = extract_json_from_response(shopping_list, array=False)
        return json.loads(shopping_list)
    except Exception as e:
        logger.error(f"Failed to generate shopping list: {e}")
        return {}

def calculate_waste_analysis(unused_ingredients: List[dict], days: int) -> dict:
    today = datetime.now()
    plan_end_date = today + timedelta(days=days)
    wasted_ingredients = []
    total_waste_cost = 0
    
    for ing in unused_ingredients:
        expiry_date = today + timedelta(days=ing['shelf_life_days'])
        reason = "unused ingredient" if expiry_date > plan_end_date else "will spoil before meal plan ends"
        
        # Convert quantity and price to float to ensure proper multiplication
        quantity = float(ing['quantity']) if isinstance(ing['quantity'], (str, int)) else ing['quantity']
        price = float(ing['price'])
        
        wasted_ingredients.append({
            "name": ing['name'],
            "quantity": quantity,
            "cost": price,
            "reason": reason,
            "expiry_date": expiry_date.strftime("%Y-%m-%d")
        })
        total_waste_cost += price * quantity
    
    return {
        "wasted_ingredients": wasted_ingredients,
        "total_potential_savings": round(total_waste_cost, 2)
    }

@app.get(
    "/",
    description="Root endpoint with API information"
)
async def root():
    return {
        "message": "Welcome to Receipt to Meal Planner API",
        "docs": "/docs",
        "endpoints": [
            {"path": "/receipt-to-meals", "method": "POST", "description": "Process receipt image and generate meal plan"}
        ]
    }
