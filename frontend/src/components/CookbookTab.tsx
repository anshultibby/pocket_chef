import { useState, useEffect } from 'react';
import { Recipe } from '@/types';
import { recipeApi } from '@/lib/api';
import RecipeCard from './RecipeCard';

export default function CookbookTab() {
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSavedRecipes = async () => {
      try {
        const recipes = await recipeApi.getSaved();
        setSavedRecipes(recipes);
      } catch (err) {
        setError('Failed to load saved recipes');
        console.error('Error loading saved recipes:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRecipes();
  }, []);

  const handleRemoveRecipe = async (id: string) => {
    try {
      await recipeApi.deleteSaved(id);
      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== id));
    } catch (err) {
      setError('Failed to remove recipe');
      console.error('Error removing recipe:', err);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading your cookbook...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold">Your Cookbook</h2>
      
      {savedRecipes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No saved recipes yet.</p>
          <p className="text-sm mt-2">Generate and save some recipes to build your cookbook!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {savedRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onRemove={handleRemoveRecipe}
            />
          ))}
        </div>
      )}
    </div>
  );
}
