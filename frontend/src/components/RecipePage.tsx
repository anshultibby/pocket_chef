'use client';

import { useState, useEffect } from 'react';
import { Recipe, RecipeWithAvailability } from '@/types';
import { recipeApi } from '@/lib/api';
import { LoadingSpinner } from './shared/LoadingSpinner';

interface RecipePageProps {
  recipeId: string;
}

export default function RecipePage({ recipeId }: RecipePageProps) {
  const [recipeData, setRecipeData] = useState<RecipeWithAvailability | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const data = await recipeApi.getRecipeDetails(recipeId);
        setRecipeData(data);
      } catch (error) {
        console.error('Failed to fetch recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [recipeId]);

  if (loading) {
    return <LoadingSpinner message="Loading recipe..." />;
  }

  if (!recipeData) {
    return <div>Recipe not found</div>;
  }

  const { recipe, available_ingredients, missing_ingredients, availability_percentage } = recipeData;

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{recipe.data.name}</h1>
        
        <div className="bg-gray-800/50 rounded-lg p-8 shadow-lg backdrop-blur-sm ring-1 ring-white/10">
          {/* Recipe Info */}
          <div className="flex gap-4 mb-8 text-sm">
            {recipe.data.preparation_time && (
              <div className="bg-gray-700/50 px-4 py-2 rounded-full">
                ⏱️ {recipe.data.preparation_time} mins
              </div>
            )}
            {recipe.data.difficulty && (
              <div className="bg-gray-700/50 px-4 py-2 rounded-full">
                🔥 {recipe.data.difficulty}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Ingredients</h2>
            <div className="mb-4">
              <div className="text-sm text-gray-400">
                Availability: {Math.round(availability_percentage)}%
              </div>
            </div>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipe.data.ingredients.map((ingredient, index) => {
                const isAvailable = available_ingredients.includes(ingredient.pantry_item_id);
                const substitutes = recipeData.substitute_suggestions[ingredient.pantry_item_id];
                
                return (
                  <li 
                    key={index} 
                    className={`flex items-center gap-2 ${
                      isAvailable ? 'text-gray-200' : 'text-yellow-500'
                    }`}
                  >
                    <span className={isAvailable ? 'text-blue-400/70' : 'text-yellow-500/70'}>•</span>
                    {ingredient.quantity} {ingredient.unit} {ingredient.notes && `(${ingredient.notes})`}
                    {!isAvailable && substitutes && (
                      <div className="text-xs text-gray-400 mt-1">
                        Substitutes: {substitutes.join(', ')}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Instructions</h2>
            <ol className="space-y-4">
              {recipe.data.instructions.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="text-blue-400/70 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                  <span className="text-gray-200">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutritional Info */}
          {recipe.data.calculated_nutrition && (
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">Nutritional Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Calories</div>
                  <div className="text-xl font-semibold">
                    {recipe.data.calculated_nutrition.per_serving.calories}
                  </div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Protein</div>
                  <div className="text-xl font-semibold">
                    {recipe.data.calculated_nutrition.per_serving.protein}g
                  </div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Carbs</div>
                  <div className="text-xl font-semibold">
                    {recipe.data.calculated_nutrition.per_serving.carbs}g
                  </div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Fat</div>
                  <div className="text-xl font-semibold">
                    {recipe.data.calculated_nutrition.per_serving.fat}g
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
