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
  const [preferences, setPreferences] = useState({
    dietary_restrictions: '',
    cuisine_type: '',
    spice_level: ''
  });
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
      
      // Combine preferences into a single string
      const preferencesArray = [];
      if (preferences.dietary_restrictions) {
        preferencesArray.push(`dietary: ${preferences.dietary_restrictions}`);
      }
      if (preferences.cuisine_type) {
        preferencesArray.push(`cuisine: ${preferences.cuisine_type}`);
      }
      if (preferences.spice_level) {
        preferencesArray.push(`spice level: ${preferences.spice_level}`);
      }
      
      const requestData = {
        ingredients,
        preferences: preferencesArray.length > 0 ? preferencesArray.join(', ') : undefined
      };

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
      setSavedRecipes(prev => [...prev, savedRecipe]);
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
          <h3 className="text-lg font-semibold mb-4 text-white">Recipe Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Dietary Restrictions
              </label>
              <select
                value={preferences.dietary_restrictions}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  dietary_restrictions: e.target.value
                }))}
                className="w-full border border-gray-800 rounded p-2 text-white bg-gray-800"
              >
                <option value="">None</option>
                <option value="vegetarian">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="gluten-free">Gluten-free</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Cuisine Type
              </label>
              <select
                value={preferences.cuisine_type}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  cuisine_type: e.target.value
                }))}
                className="w-full border border-gray-800 rounded p-2 text-white bg-gray-800"
              >
                <option value="">Any</option>
                <option value="italian">Italian</option>
                <option value="asian">Asian</option>
                <option value="mexican">Mexican</option>
                <option value="mediterranean">Mediterranean</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 text-gray-300">
                Spice Level
              </label>
              <select
                value={preferences.spice_level}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  spice_level: e.target.value
                }))}
                className="w-full border border-gray-800 rounded p-2 text-white bg-gray-800"
              >
                <option value="">Any</option>
                <option value="mild">Mild</option>
                <option value="medium">Medium</option>
                <option value="spicy">Spicy</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateRecipes}
            disabled={loading || pantryItems.length === 0}
            className="mt-6 w-full bg-blue-500 text-white p-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed"
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
