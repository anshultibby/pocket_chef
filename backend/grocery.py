from pydantic import BaseModel
from typing import List, Optional
import easyocr
from fastapi import UploadFile
import numpy as np
import cv2
from anthropic import Anthropic
import os
from ..models import schemas
import json

class Item(BaseModel):
    name: str
    price: Optional[float] = None
    quantity: Optional[int] = None

class ProcessedReceipt(BaseModel):
    items: List[Item]
    raw_text: str

class Meal(BaseModel):
    name: str
    ingredients: List[str]
    instructions: Optional[List[str]] = None

class MealPlan(BaseModel):
    meals: List[Meal]

reader = easyocr.Reader(['en'])

async def extract_text(file: UploadFile) -> str:
    # Read image file
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    # Run OCR
    result = reader.readtext(img)
    
    # Combine text
    return ' '.join([item[1] for item in result])

anthropic = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))

async def extract_items(text: str) -> list[schemas.Item]:
    response = anthropic.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": f"""Extract the grocery items from this receipt text and format them as a JSON array of objects with name, price (if available), and quantity (if available):
            {text}"""
        }]
    )
    
    try:
        items = json.loads(response.content[0].text)
        return [schemas.Item(**item) for item in items]
    except json.JSONDecodeError:
        return [schemas.Item(name=item.strip()) for item in response.content[0].text.split('\n') if item.strip()]

async def generate_meal_plan(items: list[schemas.Item]) -> schemas.MealPlan:
    items_text = "\n".join([item.name for item in items])
    
    response = anthropic.messages.create(
        model="claude-3-sonnet-20240229",
        max_tokens=1000,
        messages=[{
            "role": "user",
            "content": f"""Create a meal plan using these ingredients. Return as JSON with meals array containing name, ingredients, and instructions:
            {items_text}"""
        }]
    )
    
    try:
        meal_plan_data = json.loads(response.content[0].text)
        return schemas.MealPlan(**meal_plan_data)
    except json.JSONDecodeError:
        return schemas.MealPlan(meals=[])

