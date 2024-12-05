'use client';

import { useState } from 'react';
import { PantryItem, Recipe } from '@/types';
import PantryTab from '@/components/PantryTab';
import RecipesTab from '@/components/RecipesTab';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'pantry' | 'recipes'>('pantry');
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<Recipe[]>([]);

  const handleAddPantryItems = (items: PantryItem[]) => {
    setPantryItems(prev => [...prev, ...items]);
  };

  const handleUpdatePantryItem = (id: string, updates: Partial<PantryItem>) => {
    setPantryItems(prev => prev.map(item => 
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const handleDeletePantryItem = (id: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveRecipe = (recipe: Recipe) => {
    setSavedRecipes(prev => [...prev, { ...recipe, isSaved: true }]);
  };

  const handleRemoveRecipe = (id: string) => {
    setSavedRecipes(prev => prev.filter(recipe => recipe.id !== id));
  };

  return (
    <main className="min-h-screen p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Smart Kitchen Assistant</h1>
      
      <div className="flex space-x-2 mb-6 border-b">
        <button
          className={`px-4 py-2 ${
            activeTab === 'pantry' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100'
          } rounded-t-lg`}
          onClick={() => setActiveTab('pantry')}
        >
          Pantry
        </button>
        <button
          className={`px-4 py-2 ${
            activeTab === 'recipes' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white hover:bg-gray-100'
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
