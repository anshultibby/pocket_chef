'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Recipe, PantryItem } from '@/types';
import { recipeApi, pantryApi } from '@/lib/api';
import RecipeCard from '@/components/RecipeCard';
import PantryTab from '@/components/PantryTab';
import PantryOverview from '@/components/PantryOverview';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import CookbookTab from '@/components/CookbookTab';
import RecipesTab from '@/components/RecipesTab';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'cook' | 'pantry' | 'cookbook'>('cook');
  const [currentRecipes, setCurrentRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const { signOut } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const menu = document.getElementById('account-menu');
      const button = document.getElementById('account-button');
      if (menu && button && !menu.contains(event.target as Node) && !button.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchPantryItems = async () => {
      try {
        // Get the current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw new Error('Session error: ' + sessionError.message);
        }

        if (!session) {
          router.push('/login');
          return;
        }

        const { data: { session: refreshedSession }, error: refreshError } = 
          await supabase.auth.refreshSession();

        if (refreshError || !refreshedSession) {
          router.push('/login');
          return;
        }

        const items = await pantryApi.getItems();
        setPantryItems(items);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to fetch pantry items';
        setError(message);
        console.error('Fetch items error:', err);
        
        if (message.includes('authentication') || message.includes('session')) {
          router.push('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPantryItems();
  }, [router]);

  const handleRecipeClick = (recipeId: string) => {
    router.push(`/recipe/${recipeId}`);
  };

  const handleGenerateRecipe = async () => {
    setLoading(true);
    setError(null);
    try {
      const recipes = await recipeApi.generate({
        ingredients: pantryItems.map(item => item.name)
      });
      setCurrentRecipes(recipes);
    } catch (err) {
      setError('Failed to generate recipes');
      console.error('Recipe generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItems = (items: PantryItem[]) => {
    setPantryItems(prev => [...prev, ...items]);
  };

  const handleUpdateItem = (id: string, updates: Partial<PantryItem>) => {
    setPantryItems(prev => 
      prev.map(item => item.id === id ? { ...item, ...updates } : item)
    );
  };

  const handleDeleteItem = (id: string) => {
    setPantryItems(prev => prev.filter(item => item.id !== id));
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      await recipeApi.save(recipe.id);
      // Update the recipe in the current list to show it's saved
      setCurrentRecipes(prev =>
        prev.map(r =>
          r.id === recipe.id ? { ...r, is_saved: true } : r
        )
      );
    } catch (err) {
      setError('Failed to save recipe');
      console.error('Save recipe error:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      // The redirect is handled in the AuthProvider
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-950 text-white">
        {/* Header */}
        <div className="border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold mb-2">Kitchen Elf</h1>
                <p className="text-gray-400">Your magical cooking companion</p>
              </div>
              
              <div className="relative">
                <button
                  id="account-button"
                  onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white"
                >
                  <span>👤</span>
                  <span>Account</span>
                </button>
                
                {isAccountMenuOpen && (
                  <div 
                    id="account-menu"
                    className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg py-2 z-50"
                  >
                    <a 
                      href="/profile" 
                      className="block px-4 py-2 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
                    >
                      Profile Settings
                    </a>

                    <div className="border-t border-gray-700">
                      <button 
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
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
              <button
                onClick={() => setActiveTab('cookbook')}
                className={`px-4 py-3 ${
                  activeTab === 'cookbook'
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Cookbook
              </button>
            </div>
          </div>
        </div>

        {activeTab === 'cookbook' ? (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <CookbookTab />
          </div>
        ) : activeTab === 'pantry' ? (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <PantryTab
              pantryItems={pantryItems}
              onAddItems={handleAddItems}
              onUpdateItem={handleUpdateItem}
              onDeleteItem={handleDeleteItem}
              loading={loading}
            />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <RecipesTab
              onSaveRecipe={handleSaveRecipe}
              onRemoveRecipe={handleDeleteItem}
              loading={loading}
              pantryItems={pantryItems}
            />
          </div>
        )}

        {error && (
          <div className="max-w-4xl mx-auto px-4 mt-4">
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}
      </main>
    </AuthGuard>
  );
}
