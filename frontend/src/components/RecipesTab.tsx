import { useState } from 'react';
import { Recipe, PantryItem } from '@/types';
import RecipeCard from './RecipeCard';
import { recipeApi } from '@/lib/api';

interface RecipesTabProps {
  pantryItems: PantryItem[];
  savedRecipes: Recipe[];
  onSaveRecipe: (recipe: Recipe) => void;
  onRemoveRecipe: (id: string) => void;
}

export default function RecipesTab({
  pantryItems,
  savedRecipes,
  onSaveRecipe,
  onRemoveRecipe
}: RecipesTabProps) {
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'generated' | 'saved'>('generated');

  const handleGenerateRecipes = async () => {
    if (pantryItems.length === 0) {
      setError('Please add ingredients to your pantry first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ingredients = pantryItems.map(item => 
        `${item.name} (${item.quantity} ${item.unit})`
      );
      
      const requestData = { ingredients };

      const recipes = await recipeApi.generate(requestData);
      setGeneratedRecipes(recipes);
    } catch (err: unknown) {
      let errorMessage = 'Failed to generate recipes';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null) {
        const errorObj = err as any;
        errorMessage = errorObj.response?.data?.detail || JSON.stringify(err);
      }

      setError(errorMessage);
      console.error('Recipe generation error:', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      const savedRecipe = await recipeApi.save(recipe.id);
      onSaveRecipe(savedRecipe);
    } catch (error) {
      console.error('Failed to save recipe:', error);
      setError('Failed to save recipe');
    }
  };

  return (
    <div className="space-y-8">
      {/* Recipe Generation Section */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Generate New Recipes</h2>
          <p className="text-gray-400 mt-2">
            Use your pantry ingredients to generate personalized recipe suggestions
          </p>
        </div>

        {/* Pantry Overview - Collapsed by default */}
        <details className="p-4 border-b border-gray-800">
          <summary className="text-white cursor-pointer">
            Available Ingredients ({pantryItems.length})
          </summary>
          <div className="mt-4 flex flex-wrap gap-2">
            {pantryItems.map(item => (
              <span 
                key={item.id}
                className="bg-gray-800 px-3 py-1 rounded-full shadow-sm text-sm text-gray-100"
              >
                {item.name} ({item.quantity} {item.unit})
              </span>
            ))}
          </div>
        </details>

        {/* Preferences Section */}
        <div className="p-6">
          <button
            onClick={handleGenerateRecipes}
            disabled={loading || pantryItems.length === 0}
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Generating Recipes...' : 'Generate Recipes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Modified Recipe Results Tabs */}
      <div className="bg-gray-900 rounded-lg border border-gray-800">
        <div className="border-b border-gray-800">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('generated')}
              className={`px-6 py-3 ${
                activeTab === 'generated' 
                  ? 'text-blue-500 border-b-2 border-blue-500' 
                  : 'text-gray-400'
              }`}
            >
              Generated Recipes ({generatedRecipes.length})
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-6 py-3 ${
                activeTab === 'saved'
                  ? 'text-green-500 border-b-2 border-green-500' 
                  : 'text-gray-400'
              }`}
            >
              Saved Recipes ({savedRecipes.length})
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Generated Recipes Tab */}
          {activeTab === 'generated' && (
            <>
              {generatedRecipes.length > 0 ? (
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
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>No generated recipes yet. Use the form above to generate some recipes!</p>
                </div>
              )}
            </>
          )}

          {/* Saved Recipes Tab */}
          {activeTab === 'saved' && (
            <>
              {savedRecipes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedRecipes.map(recipe => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      onSave={onSaveRecipe}
                      onRemove={onRemoveRecipe}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  <p>No saved recipes yet. Generate and save some recipes to see them here!</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
