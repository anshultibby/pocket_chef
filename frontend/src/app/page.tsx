'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import RecipesTab from '@/components/RecipesTab';
import PantryTab from '@/components/PantryTab';
import { usePantryStore } from '@/stores/pantryStore';
import ElfModal from '@/components/modals/ElfModal';
import { CookbookTab } from '@/components/cookbook';
import { track } from '@vercel/analytics';
import { useRouter } from 'next/navigation';
import { useReceiptStore } from '@/stores/receiptStore';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import { toast } from 'react-hot-toast';
import { useDuplicateStore } from '@/stores/duplicateStore';
import DuplicateItemModal from '@/components/modals/DuplicateItemModal';
import AddItemModal from '@/components/modals/AddItemModal';

type TabType = 'cook' | 'pantry' | 'cookbook';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'cook' | 'pantry' | 'cookbook'>(() => {
    // Try to get saved tab from localStorage, default to 'cook' if not found
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('activeTab') as 'cook' | 'pantry' | 'cookbook') || 'cook';
    }
    return 'cook';
  });
  const { 
    items: pantryItems, 
    isLoading, 
    error, 
    fetchItems, 
    addItems,
    updateItem 
  } = usePantryStore();
  const { 
    duplicateItem,
    isProcessing,
    isEditing,
    handleDuplicateResolution,
    handleEditComplete,
    clearDuplicates,
    handleItems
  } = useDuplicateStore();
  const { signOut } = useAuth();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [showElfModal, setShowElfModal] = useState(false);
  const sessionStartTime = useRef(Date.now());
  const lastTabChange = useRef(Date.now());
  const isHidden = useRef(false);
  const router = useRouter();
  const { 
    showConfirmation, 
    pendingItems, 
    receiptImage, 
    clearUpload,
  } = useReceiptStore();

  // Save active tab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

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

  useEffect(() => {
    // Track session start
    track('session_start', {
      startTime: new Date().toISOString(),
      initialTab: activeTab
    });

    // Track when user leaves the page
    const handleBeforeUnload = () => {
      const sessionDuration = Math.round((Date.now() - sessionStartTime.current) / 1000);
      track('session_end', {
        duration: sessionDuration,
        endTime: new Date().toISOString(),
        lastActiveTab: activeTab
      });
    };

    // Track when user switches tabs/minimizes window
    const handleVisibilityChange = () => {
      if (document.hidden) {
        isHidden.current = true;
        track('page_hidden', {
          timeSpent: Math.round((Date.now() - sessionStartTime.current) / 1000),
          activeTab
        });
      } else {
        if (isHidden.current) {
          track('page_visible', {
            awayTime: Math.round((Date.now() - lastTabChange.current) / 1000),
            returnedToTab: activeTab
          });
        }
        isHidden.current = false;
        lastTabChange.current = Date.now();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [activeTab]);

  useEffect(() => {
    // Send heartbeat every 5 minutes
    const heartbeatInterval = setInterval(() => {
      if (!document.hidden) {
        track('heartbeat', {
          activeTab,
          sessionDuration: Math.round((Date.now() - sessionStartTime.current) / 1000),
          lastInteraction: Math.round((Date.now() - lastTabChange.current) / 1000)
        });
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(heartbeatInterval);
  }, [activeTab]);

  const handleSignOut = async () => {
    try {
      await signOut();
      // The redirect is handled in the AuthProvider
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleTabChange = (newTab: TabType) => {
    const { uploadState } = useReceiptStore.getState();
    
    if (uploadState !== 'idle') {
      const confirm = window.confirm(
        'Changing tabs will cancel your receipt upload. Continue?'
      );
      if (!confirm) return;
      clearUpload();
    }
    
    setActiveTab(newTab);
    localStorage.setItem('activeTab', newTab);
    track('tab_change', {
      from: activeTab,
      to: newTab,
      uploadState
    });
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
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => router.push('/onboarding')}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <span>🎯</span>
                  <span>Redo Onboarding</span>
                </button>

                <button
                  onClick={() => setShowElfModal(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <span>🧝‍♂️</span>
                  <span>Summon Elf</span>
                </button>
                
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
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-800">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex space-x-1">
              <button
                onClick={() => handleTabChange('cook')}
                className={`px-4 py-3 ${
                  activeTab === 'cook'
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Recipe Suggestions
              </button>
              <button
                onClick={() => handleTabChange('pantry')}
                className={`px-4 py-3 ${
                  activeTab === 'pantry'
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Pantry
              </button>
              <button
                onClick={() => handleTabChange('cookbook')}
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

        {/* Tab Content */}
        <div className="max-w-4xl mx-auto px-4 py-12">
          {activeTab === 'pantry' ? (
            <PantryTab />
          ) : activeTab === 'cookbook' ? (
            <CookbookTab />
          ) : (
            <RecipesTab
              loading={isLoading}
              pantryItems={pantryItems}
            />
          )}
        </div>

        {/* Error display */}
        {error && (
          <div className="max-w-4xl mx-auto px-4 mt-4">
            <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        )}

        {/* Modals */}
        {showElfModal && (
          <ElfModal
            onClose={() => setShowElfModal(false)}
            pantryItemsCount={pantryItems.length}
          />
        )}

        {showConfirmation && pendingItems && (
          <ReceiptConfirmation
            items={pendingItems}
            receiptImage={receiptImage}
            onConfirm={async (items) => {
              try {
                await handleItems(items, pantryItems);
                useReceiptStore.getState().setShowConfirmation(false);
              } catch (error) {
                console.error('Error confirming items:', error);
                toast.error('Failed to add items to pantry');
                clearUpload();
              }
            }}
            onCancel={clearUpload}
          />
        )}

        {duplicateItem && !isEditing && (
          <DuplicateItemModal
            existingItem={duplicateItem.existing}
            newItem={duplicateItem.new}
            onMergeQuantities={() => handleDuplicateResolution('merge', addItems, updateItem)}
            onMergeAndEdit={() => handleDuplicateResolution('mergeEdit', addItems, updateItem)}
            onCreateNew={() => handleDuplicateResolution('create', addItems, updateItem)}
            onCancel={() => {
              clearDuplicates();
              clearUpload();
            }}
            isProcessing={isProcessing}
          />
        )}

        {isEditing && duplicateItem && (
          <AddItemModal
            initialValues={{
              data: {
                ...duplicateItem.existing.data,
                quantity: duplicateItem.existing.data.quantity + duplicateItem.new.data.quantity
              },
              nutrition: duplicateItem.existing.nutrition
            }}
            onAdd={async (updatedItem) => {
              try {
                await handleEditComplete(updatedItem, updateItem);
              } catch (error) {
                toast.error('Failed to update item');
                // Keep the editing state active so user can retry
                useDuplicateStore.getState().setIsProcessing(false);
              }
            }}
            onClose={() => {
              // When manually closing, clear both states
              useDuplicateStore.getState().setIsEditing(false);
              useDuplicateStore.getState().setIsProcessing(false);
            }}
            isEditing={true}
          />
        )}
      </main>
    </AuthGuard>
  );
}
