import { useState } from 'react';
import { Recipe, PantryItem } from '@/types';
import RecipeCard from './RecipeCard';
import { generateRecipes, saveRecipe } from '@/lib/api';

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

  const handleGenerateRecipes = async () => {
    if (pantryItems.length === 0) {
      setError('Please add ingredients to your pantry first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const ingredients = pantryItems.map(item => item.name);
      const recipes = await generateRecipes(ingredients, preferences);
      setGeneratedRecipes(recipes);
    } catch (err) {
      setError('Failed to generate recipes. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Pantry Overview */}
      <section className="bg-gray-50 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-4">Available Ingredients</h2>
        <div className="flex flex-wrap gap-2">
          {pantryItems.map(item => (
            <span 
              key={item.id}
              className="bg-white px-3 py-1 rounded-full shadow-sm text-sm"
            >
              {item.name} ({item.quantity} {item.unit})
            </span>
          ))}
        </div>
      </section>

      {/* Preferences Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4">Recipe Preferences</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Dietary Restrictions
            </label>
            <select
              value={preferences.dietary_restrictions}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                dietary_restrictions: e.target.value
              }))}
              className="w-full border rounded p-2"
            >
              <option value="">None</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="gluten-free">Gluten-free</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Cuisine Type
            </label>
            <select
              value={preferences.cuisine_type}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                cuisine_type: e.target.value
              }))}
              className="w-full border rounded p-2"
            >
              <option value="">Any</option>
              <option value="italian">Italian</option>
              <option value="asian">Asian</option>
              <option value="mexican">Mexican</option>
              <option value="mediterranean">Mediterranean</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Spice Level
            </label>
            <select
              value={preferences.spice_level}
              onChange={(e) => setPreferences(prev => ({
                ...prev,
                spice_level: e.target.value
              }))}
              className="w-full border rounded p-2"
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
          className="mt-4 w-full bg-blue-500 text-white p-3 rounded-lg disabled:bg-gray-300"
        >
          {loading ? 'Generating Recipes...' : 'Generate Recipes'}
        </button>
      </section>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Generated Recipes */}
      {generatedRecipes.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Generated Recipes</h2>
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
        </section>
      )}

      {/* Saved Recipes */}
      {savedRecipes.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4">Saved Recipes</h2>
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
        </section>
      )}
    </div>
  );
}
