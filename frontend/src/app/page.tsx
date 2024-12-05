'use client';

import { useState, useEffect } from 'react';
import { PantryItem, Recipe } from '@/types';
import PantryTab from '@/components/PantryTab';
import RecipesTab from '@/components/RecipesTab';
import { pantryApi, recipeApi } from '@/lib/api';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'pantry' | 'recipes'>('pantry');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        setConnectionError(null);
        const [savedRecipesData] = await Promise.all([
          recipeApi.getSaved(),
          // Add other initial data fetches here
        ]);
        setSavedRecipes(savedRecipesData);
      } catch (error) {
        const errorMessage = 'Cannot connect to backend service. Please ensure the backend is running.';
        setConnectionError(errorMessage);
        console.error(errorMessage, error);
      }
    };

    loadInitialData();
  }, []);

  if (connectionError) {
    return (
      <main className="min-h-screen p-8 max-w-7xl mx-auto bg-black text-white">
        <div className="p-4 bg-red-900 text-white rounded-lg">
          <h2 className="text-xl font-bold mb-2">Connection Error</h2>
          <p>{connectionError}</p>
        </div>
      </main>
    );
  }

  const handleAddPantryItems = async (items: PantryItem[]) => {
    try {
      const newItems = await pantryApi.addItems(items);
      setPantryItems(prev => [...prev, ...newItems]);
    } catch (error: unknown) {
      console.error('Failed to add pantry items:', error);
    }
  };

  const handleUpdatePantryItem = async (id: string, updates: Partial<PantryItem>) => {
    try {
      const updatedItem = await pantryApi.updateItem(id, updates);
      setPantryItems(prev => prev.map(item => 
        item.id === id ? updatedItem : item
      ));
    } catch (error) {
      console.error('Failed to update pantry item:', error);
    }
  };

  const handleDeletePantryItem = async (id: string) => {
    try {
      await pantryApi.deleteItem(id);
      setPantryItems(prev => prev.filter(item => item.id !== id));
    } catch (error) {
      console.error('Failed to delete pantry item:', error);
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      await recipeApi.save(recipe);
      setSavedRecipes(prev => [...prev, { ...recipe, isSaved: true }]);
    } catch (error) {
      console.error('Failed to save recipe:', error);
    }
  };

  const handleRemoveRecipe = async (id: string) => {
    try {
      await recipeApi.deleteSaved(id);
      setSavedRecipes(prev => prev.filter(recipe => recipe.id !== id));
    } catch (error) {
      console.error('Failed to remove recipe:', error);
    }
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto bg-black text-white">
      <h1 className="text-3xl font-bold mb-8 text-white">Smart Kitchen Assistant</h1>
      
      <div className="flex space-x-2 mb-6 border-b border-gray-800">
        <button
          className={`px-4 py-2 ${
            activeTab === 'pantry' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-900 hover:bg-gray-800 text-gray-100'
          } rounded-t-lg`}
          onClick={() => setActiveTab('pantry')}
        >
          Pantry
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'recipes' 
              ? 'bg-blue-600 text-white' 
              : 'bg-gray-900 hover:bg-gray-800 text-gray-100'
          } rounded-t-lg`}
          onClick={() => setActiveTab('recipes')}
        >
          Recipes
        </button>
      </div>

      {activeTab === 'pantry' ? (
        <PantryTab
          pantryItems={pantryItems}
          onAddItems={handleAddPantryItems}
          onUpdateItem={handleUpdatePantryItem}
          onDeleteItem={handleDeletePantryItem}
        />
      ) : (
        <RecipesTab
          pantryItems={pantryItems}
          savedRecipes={savedRecipes}
          onSaveRecipe={handleSaveRecipe}
          onRemoveRecipe={handleRemoveRecipe}
        />
      )}
    </main>
  );
}
