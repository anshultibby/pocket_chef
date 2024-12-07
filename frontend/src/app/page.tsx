'use client';

import { useState } from 'react';
import { Recipe, PantryItem } from '@/types';
import { recipeApi } from '@/lib/api';
import RecipeCard from '@/components/RecipeCard';
import PantryTab from '@/components/PantryTab';
import PantryOverview from '@/components/PantryOverview';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cook' | 'pantry'>('cook');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecipes, setCurrentRecipes] = useState<Recipe[]>([]);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [preferences, setPreferences] = useState({
    dietary_restrictions: '',
    cuisine_type: '',
    spice_level: ''
  });

  const handleGenerateRecipe = async () => {
    setLoading(true);
    setError(null);

    try {
      const recipes = await recipeApi.generate({
        ingredients: pantryItems.map(item => `${item.name} (${item.quantity} ${item.unit})`),
        preferences: formatPreferences()
      });
      setCurrentRecipes(recipes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recipe');
    } finally {
      setLoading(false);
    }
  };

  const formatPreferences = () => {
    const prefs = [];
    if (preferences.dietary_restrictions) {
      prefs.push(`dietary: ${preferences.dietary_restrictions}`);
    }
    if (preferences.cuisine_type) {
      prefs.push(`cuisine: ${preferences.cuisine_type}`);
    }
    if (preferences.spice_level) {
      prefs.push(`spice level: ${preferences.spice_level}`);
    }
    return prefs.join(', ');
  };

  const handleAddItems = (items: PantryItem[]) => {
    setPantryItems(items);
  };

  const handleUpdateItem = (id: string, updates: Partial<PantryItem>) => {
    setPantryItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleDeleteItem = (id: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-2">Kitchen Elf</h1>
          <p className="text-gray-400">Your magical cooking companion</p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-800">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('cook')}
              className={`px-4 py-3 ${
                activeTab === 'cook'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Recipe Suggestions
            </button>
            <button
              onClick={() => setActiveTab('pantry')}
              className={`px-4 py-3 ${
                activeTab === 'pantry'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              Pantry
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'cook' ? (
        <>
          {/* Recipe Generation Section */}
          <div className="bg-gradient-to-b from-gray-900 to-gray-950 py-12">
            <div className="max-w-4xl mx-auto px-4">
              <h2 className="text-3xl font-bold mb-6">
                Recipe Suggestions
              </h2>

              {/* Preferences Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <select
                  value={preferences.dietary_restrictions}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    dietary_restrictions: e.target.value
                  }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
                >
                  <option value="">Any dietary restrictions?</option>
                  <option value="vegetarian">Vegetarian</option>
                  <option value="vegan">Vegan</option>
                  <option value="gluten-free">Gluten-free</option>
                </select>

                <select
                  value={preferences.cuisine_type}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    cuisine_type: e.target.value
                  }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
                >
                  <option value="">Any cuisine preference?</option>
                  <option value="italian">Italian</option>
                  <option value="asian">Asian</option>
                  <option value="mexican">Mexican</option>
                  <option value="mediterranean">Mediterranean</option>
                </select>

                <select
                  value={preferences.spice_level}
                  onChange={(e) => setPreferences(prev => ({
                    ...prev,
                    spice_level: e.target.value
                  }))}
                  className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-white"
                >
                  <option value="">Spice level?</option>
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="spicy">Spicy</option>
                </select>
              </div>

              <button
                onClick={handleGenerateRecipe}
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Asking the Kitchen Elf...' : 'Get Recipe Ideas'}
              </button>
            </div>
          </div>

          {/* Recipe Results */}
          {error && (
            <div className="max-w-4xl mx-auto px-4 py-6">
              <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
                {error}
              </div>
            </div>
          )}

          {currentRecipes.length > 0 && (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <h2 className="text-2xl font-bold mb-6">Recipe Suggestions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentRecipes.map(recipe => (
                  <div 
                    key={recipe.id}
                    className="bg-gray-800 rounded-lg p-4 cursor-pointer hover:bg-gray-700 transition-colors"
                  >
                    <div onClick={() => handleRecipeClick(recipe.id)}>
                      <h3 className="text-xl font-semibold mb-2">{recipe.name}</h3>
                    </div>
                    <button
                      onClick={() => {/* Handle save */}}
                      className="mt-2 text-sm text-blue-400 hover:text-blue-300"
                    >
                      Save Recipe
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Simplified Pantry Overview */}
          <div className="max-w-4xl mx-auto px-4 py-12">
            <PantryOverview 
              pantryItems={pantryItems}
              onManagePantry={() => setActiveTab('pantry')} 
            />
          </div>
        </>
      ) : (
        // Pantry Management Tab - Using existing PantryTab
        <div className="max-w-4xl mx-auto px-4 py-12">
          <PantryTab
            pantryItems={pantryItems}
            onAddItems={handleAddItems}
            onUpdateItem={handleUpdateItem}
            onDeleteItem={handleDeleteItem}
          />
        </div>
      )}
    </main>
  );
}
