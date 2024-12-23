import { useState } from 'react';
import { Recipe, PantryItem, MealCategory, RecipeGenerateRequest, RecipeWithAvailability } from '@/types';
import RecipeCard from './RecipeCard';
import { recipeApi } from '@/lib/api';

interface RecipesTabProps {
  onSaveRecipe: (recipe: Recipe) => Promise<void>;
  onRemoveRecipe: (id: string) => void;
  pantryItems: PantryItem[];
  loading: boolean;
}

export default function RecipesTab({
  onSaveRecipe,
  onRemoveRecipe,
  pantryItems,
  loading: parentLoading
}: RecipesTabProps) {
  const [recipes, setRecipes] = useState<Record<MealCategory, RecipeWithAvailability[]>>({
    breakfast: [],
    lunch: [],
    dinner: [],
    snack: []
  });
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchRecipes = async () => {
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);

    try {
      // First try to get existing recipes
      const recipesByCategory = await recipeApi.getByCategory();
      setRecipes(recipesByCategory);
      setIsGenerating(false);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  };

  const pollForRecipes = async () => {
    let attempts = 0;
    const maxAttempts = 10;
    const pollInterval = 20000; // 20 seconds

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setError('Recipe generation timed out');
        setIsGenerating(false);
        return;
      }

      try {
        const recipesByCategory = await recipeApi.getByCategory();
        const stillGenerating = Object.values(recipesByCategory).some(
          recipes => recipes.length === 0
        );

        if (!stillGenerating) {
          setRecipes(recipesByCategory);
          setIsGenerating(false);
        } else {
          attempts++;
          setTimeout(poll, pollInterval);
        }
      } catch (err) {
        handleError(err);
        setIsGenerating(false);
      }
    };

    poll();
  };

  const handleError = (err: unknown) => {
    let message = 'An error occurred';
    if (err instanceof Error) message = err.message;
    else if (typeof err === 'string') message = err;
    setError(message);
    console.error('Recipe error:', err);
    setIsGenerating(false);
    setIsLoading(false);
  };

  const handleGenerateRecipes = async () => {
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);

    try {
      const request: RecipeGenerateRequest = {
        categories: [
          { category: 'breakfast' as MealCategory, count: 3 },
          { category: 'lunch' as MealCategory, count: 3 },
          { category: 'dinner' as MealCategory, count: 3 },
          { category: 'snack' as MealCategory, count: 2 }
        ]
      };
      
      await recipeApi.generate(request);
      await fetchRecipes();
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleSave = (recipeData: RecipeWithAvailability) => {
    return async () => {
      await onSaveRecipe(recipeData.recipe);
    };
  };

  const handleRemove = (recipeId: string) => {
    return () => {
      onRemoveRecipe(recipeId);
    };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-start">
        <div className="space-y-2">
          {pantryItems.length === 0 && (
            <div className="text-sm text-yellow-300/90 bg-yellow-900/20 px-4 py-2 rounded-t-lg border border-yellow-700/50">
              Add ingredients to your pantry to enable recipe generation
            </div>
          )}
          <button
            onClick={fetchRecipes}
            disabled={isLoading || isGenerating || pantryItems.length === 0}
            className={`px-4 py-2 rounded-lg ${pantryItems.length === 0 ? 'rounded-t-none' : ''} transition-colors ${
              isLoading || isGenerating || pantryItems.length === 0
                ? 'bg-red-900/20 text-red-400 border border-red-700/50 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white border border-green-600'
            }`}
          >
            {isLoading || isGenerating ? (
              <>
                <span className="animate-spin inline-block mr-2">⟳</span>
                {isGenerating ? 'Generating...' : 'Loading...'}
              </>
            ) : (
              'Get Recipe Suggestions'
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {(isLoading || isGenerating) && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">
            {isGenerating ? 'Generating your recipes...' : 'Loading recipes...'}
          </p>
        </div>
      )}

      {!isLoading && !isGenerating && (
        Object.entries(recipes).map(([category, categoryRecipes]) => (
          <div key={category} className="space-y-4">
            <h2 className="text-xl font-bold text-white capitalize">{category}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categoryRecipes.map(recipeData => (
                <RecipeCard
                  key={recipeData.recipe.id}
                  recipeData={recipeData}
                  onSave={handleSave(recipeData)}
                  onRemove={handleRemove(recipeData.recipe.id)}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
