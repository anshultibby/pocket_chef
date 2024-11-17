'use client';

import { useState } from 'react';
import Image from 'next/image';

interface Ingredient {
  name: string;
  price: number;
  quantity: string;
  shelf_life_days: number;
}

interface NutritionalAnalysis {
  calories_per_serving: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  key_nutrients: string[];
  health_rating: number;
}

interface Meal {
  name: string;
  ingredients: string[];
  instructions: string[];
  nutritional_analysis?: NutritionalAnalysis;
  servings: number;
}

interface WastedIngredient {
  name: string;
  cost: number;
  reason: string;
  expiry_date: string;
}

interface WasteAnalysis {
  wasted_ingredients: WastedIngredient[];
  total_potential_savings: number;
}

interface MealPlanResponse {
  ingredients: Ingredient[];
  meal_plan: {
    meals: Meal[];
    days: number;
    people: number;
  };
  waste_analysis?: WasteAnalysis;
  nutritional_analyses?: NutritionalAnalysis[];
  total_people: number;
}

interface ShoppingListResponse {
  shopping_list: Record<string, string[]>;
  nutritional_analysis: Record<string, any>[];
}

interface RecipeInput {
  recipes: string;  // Raw text input of recipes
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [days, setDays] = useState(3);
  const [people, setPeople] = useState(2);
  const [recipes, setRecipes] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MealPlanResponse | null>(null);
  const [shoppingList, setShoppingList] = useState<any>(null);

  const handleReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('days', days.toString());
    formData.append('people', people.toString());

    try {
      const response = await fetch('http://localhost:8000/receipt-to-meals', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipes.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('http://localhost:8000/shopping-list', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipes: recipes }),
      });
      const data = await response.json();
      setShoppingList(data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Kitchen Helper</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Receipt Upload Section */}
        <section className="p-6 border rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Receipt to Meal Plan</h2>
          <form onSubmit={handleReceiptSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Upload Receipt Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="border p-2 rounded w-full"
              />
            </div>
            
            <div>
              <label className="block mb-2">Number of Days:</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value))}
                min="1"
                max="7"
                className="border p-2 rounded w-full"
              />
            </div>

            <div>
              <label className="block mb-2">Number of People:</label>
              <input
                type="number"
                value={people}
                onChange={(e) => setPeople(parseInt(e.target.value))}
                min="1"
                className="border p-2 rounded w-full"
              />
            </div>
            
            <button
              type="submit"
              disabled={!file || loading}
              className="bg-blue-500 text-white px-4 py-2 rounded w-full disabled:bg-gray-400 hover:bg-blue-600"
            >
              {loading ? 'Processing...' : 'Generate Meal Plan'}
            </button>
          </form>
        </section>

        {/* Recipe to Shopping List Section */}
        <section className="p-6 border rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Recipe to Shopping List</h2>
          <form onSubmit={handleRecipeSubmit} className="space-y-4">
            <div>
              <label className="block mb-2">Enter Recipes:</label>
              <textarea
                value={recipes}
                onChange={(e) => setRecipes(e.target.value)}
                className="border p-2 rounded w-full h-40"
                placeholder="Enter your recipes here..."
              />
            </div>
            
            <button
              type="submit"
              disabled={!recipes.trim() || loading}
              className="bg-green-500 text-white px-4 py-2 rounded w-full disabled:bg-gray-400 hover:bg-green-600"
            >
              {loading ? 'Processing...' : 'Generate Shopping List'}
            </button>
          </form>
        </section>
      </div>

      {/* Results Section */}
      {(result || shoppingList) && (
        <div className="space-y-8">
          {/* Receipt Results */}
          {result && (
            <>
              <section>
                <h2 className="text-2xl font-bold mb-4">Ingredients</h2>
                <ul className="list-disc pl-5">
                  {result.ingredients.map((ing, i) => (
                    <li key={i}>
                      {ing.name} - ${ing.price} ({ing.quantity})
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Meal Plan</h2>
                {result.meal_plan.meals.map((meal, i) => (
                  <div key={i} className="mb-6 p-4 border rounded">
                    <h3 className="text-xl font-semibold mb-2">{meal.name}</h3>
                    <p className="text-gray-600 mb-2">Serves: {meal.servings}</p>
                    
                    <h4 className="font-medium">Ingredients:</h4>
                    <ul className="list-disc pl-5 mb-2">
                      {meal.ingredients.map((ing, j) => (
                        <li key={j}>{ing}</li>
                      ))}
                    </ul>
                    
                    <h4 className="font-medium">Instructions:</h4>
                    <ol className="list-decimal pl-5 mb-4">
                      {meal.instructions.map((step, j) => (
                        <li key={j}>{step}</li>
                      ))}
                    </ol>

                    {meal.nutritional_analysis && (
                      <div className="bg-gray-50 p-3 rounded">
                        <h4 className="font-medium">Nutritional Info:</h4>
                        <p>Calories: {meal.nutritional_analysis.calories_per_serving} kcal</p>
                        <p>Protein: {meal.nutritional_analysis.protein_g}g</p>
                        <p>Carbs: {meal.nutritional_analysis.carbs_g}g</p>
                        <p>Fats: {meal.nutritional_analysis.fats_g}g</p>
                        <p>Health Rating: {meal.nutritional_analysis.health_rating}/5</p>
                      </div>
                    )}
                  </div>
                ))}
              </section>

              <section>
                <h2 className="text-2xl font-bold mb-4">Waste Analysis</h2>
                <p className="mb-2">Potential Savings: ${result.waste_analysis?.total_potential_savings}</p>
                <h3 className="font-medium mb-2">Wasted Ingredients:</h3>
                <ul className="list-disc pl-5">
                  {result.waste_analysis?.wasted_ingredients.map((item, i) => (
                    <li key={i}>
                      {item.name} - ${item.cost} ({item.reason}, expires: {item.expiry_date})
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}

          {/* Shopping List Results */}
          {shoppingList && (
            <section>
              <h2 className="text-2xl font-bold mb-4">Shopping List</h2>
              {Object.entries(shoppingList.shopping_list).map(([category, items]: [string, any]) => (
                <div key={category} className="mb-4">
                  <h3 className="text-xl font-semibold mb-2 capitalize">{category}</h3>
                  <ul className="list-disc pl-5">
                    {items.map((item: string, i: number) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}

              <h3 className="text-xl font-semibold mt-6 mb-4">Nutritional Analysis</h3>
              {shoppingList.nutritional_analysis.map((analysis: any, i: number) => (
                <div key={i} className="mb-4 p-4 bg-gray-50 rounded">
                  <p>Calories: {analysis.calories_per_serving} kcal</p>
                  <p>Protein: {analysis.protein_g}g</p>
                  <p>Carbs: {analysis.carbs_g}g</p>
                  <p>Fats: {analysis.fats_g}g</p>
                  <p>Health Rating: {analysis.health_rating}/5</p>
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
