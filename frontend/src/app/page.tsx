'use client';

import { useState, useEffect } from 'react';
import PantryTab from '@/components/PantryTab';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import RecipesTab from '@/components/RecipesTab';
import { usePantryStore } from '@/stores/pantryStore';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'cook' | 'pantry'>('cook');
  const { items, isLoading, error, fetchItems } = usePantryStore();
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
    fetchItems();
  }, [fetchItems]);

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
            </div>
          </div>
        </div>

        {activeTab === 'pantry' ? (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <PantryTab />
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-12">
            <RecipesTab
              loading={isLoading}
              pantryItems={items}
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
