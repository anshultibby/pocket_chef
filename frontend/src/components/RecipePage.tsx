'use client';

import { useEffect, useState } from 'react';
import { Recipe } from '@/types';
import { recipeApi } from '@/lib/api';

export default function RecipePage({ params }: { params: { id: string } }) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecipe = async () => {
      try {
        const recipeData = await recipeApi.getRecipe(params.id);
        setRecipe(recipeData);
      } catch (error) {
        console.error('Failed to fetch recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipe();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="animate-pulse text-xl">Loading your recipe...</div>
      </div>
    );
  }

  if (!recipe) {
    return (
      <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center">
        <div className="text-xl text-red-400">Recipe not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">{recipe.name}</h1>
        
        <div className="bg-gray-800/50 rounded-lg p-8 shadow-lg backdrop-blur-sm ring-1 ring-white/10">
          {/* Recipe Info */}
          <div className="flex gap-4 mb-8 text-sm">
            {recipe.preparation_time && (
              <div className="bg-gray-700/50 px-4 py-2 rounded-full">
                ⏱️ {recipe.preparation_time}
              </div>
            )}
            {recipe.difficulty && (
              <div className="bg-gray-700/50 px-4 py-2 rounded-full">
                🔥 {recipe.difficulty}
              </div>
            )}
          </div>

          {/* Ingredients */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Ingredients</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recipe.ingredients.map((ingredient, index) => (
                <li key={index} className="flex items-center gap-2 text-gray-200">
                  <span className="text-blue-400/70">•</span>
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-blue-400">Instructions</h2>
            <ol className="space-y-4">
              {recipe.instructions.map((step, index) => (
                <li key={index} className="flex gap-4">
                  <span className="text-blue-400/70 font-mono">{(index + 1).toString().padStart(2, '0')}</span>
                  <span className="text-gray-200">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Nutritional Info */}
          {recipe.nutritional_info && (
            <div className="mt-8 pt-8 border-t border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-blue-400">Nutritional Information</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Calories</div>
                  <div className="text-xl font-semibold">{recipe.nutritional_info.calories}</div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Protein</div>
                  <div className="text-xl font-semibold">{recipe.nutritional_info.protein}g</div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Carbs</div>
                  <div className="text-xl font-semibold">{recipe.nutritional_info.carbs}g</div>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-lg">
                  <div className="text-sm text-gray-400">Fat</div>
                  <div className="text-xl font-semibold">{recipe.nutritional_info.fat}g</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
