import { useState } from 'react';
import { Recipe, PantryItem } from '@/types';
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
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateRecipes = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const recipes = await recipeApi.generate({
        ingredients: []  // We'll modify this later to use preferences instead
      });
      setGeneratedRecipes(recipes);
    } catch (err: unknown) {
      let errorMessage = 'Failed to generate recipes';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Recipe generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Recipe Generation Section */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Generate New Recipes</h2>
          <p className="text-gray-400 mt-2">
            Get personalized recipe suggestions
          </p>
        </div>

        <div className="p-6">
          <button
            onClick={handleGenerateRecipes}
            disabled={isGenerating || parentLoading}
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isGenerating ? 'Generating Recipes...' : 'Generate Recipes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Recipe Results */}
      {generatedRecipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {generatedRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onSave={onSaveRecipe}
              onRemove={onRemoveRecipe}
            />
          ))}
        </div>
      )}
    </div>
  );
}
