'use client';

import { useState, useEffect, useRef } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import RecipesTab from '@/components/RecipesTab';
import PantryTab from '@/components/PantryTab';
import { usePantryStore } from '@/stores/pantryStore';
import { useRecipeStore } from '@/stores/recipeStore';
import ElfModal from '@/components/modals/ElfModal';
import { CookbookTab } from '@/components/cookbook';
import { track } from '@vercel/analytics';
import { useReceiptStore } from '@/stores/receiptStore';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import { toast } from 'react-hot-toast';
import { useDuplicateStore } from '@/stores/duplicateStore';
import DuplicateItemModal from '@/components/modals/DuplicateItemModal';
import AddItemModal from '@/components/modals/AddItemModal';
import Link from 'next/link';
import FeedbackModal from '@/components/modals/FeedbackModal';
import { SparklesIcon, Square3Stack3DIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import { motion, useMotionValue, useTransform, useAnimation } from 'framer-motion';

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
  const { 
    showConfirmation, 
    pendingItems, 
    receiptImage, 
    clearUpload,
  } = useReceiptStore();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Pull to refresh setup
  const y = useMotionValue(0);
  const pullProgress = useTransform(y, [0, 100], [0, 1]);
  const controls = useAnimation();
  const refreshIndicatorControls = useAnimation();
  const pullThreshold = 100;
  const isDragging = useRef(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (activeTab === 'pantry') {
        await fetchItems();
      } else if (activeTab === 'cook') {
        await useRecipeStore.getState().fetchRecipes();
      }
      // Add cookbook refresh when implemented
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

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

  const handleTabChange = async (newTab: TabType) => {
    const { uploadState } = useReceiptStore.getState();
    
    if (uploadState !== 'idle') {
      const confirm = window.confirm(
        'Changing tabs will cancel your receipt upload. Continue?'
      );
      if (!confirm) return;
      clearUpload();
    }
    
    // Change tab immediately for UI responsiveness
    setActiveTab(newTab);
    localStorage.setItem('activeTab', newTab);

    // Track analytics
    track('tab_change', {
      from: activeTab,
      to: newTab,
      uploadState
    });

    // Refresh data in background
    if (newTab === 'pantry') {
      console.log('Starting pantry refresh...');
      try {
        const pantryStore = usePantryStore.getState();
        await pantryStore.fetchItems();
        console.log('Pantry refresh completed');
      } catch (error) {
        console.error('Error refreshing pantry items:', error);
        toast.error('Failed to refresh pantry items');
      }
    } else if (newTab === 'cook' || newTab === 'cookbook') {
      console.log(`Starting ${newTab} refresh...`);
      try {
        const recipeStore = useRecipeStore.getState();
        await recipeStore.invalidateCache(); // Invalidate cache first
        await recipeStore.fetchRecipes(); // Then fetch fresh data
        console.log(`${newTab} refresh completed`);
      } catch (error) {
        console.error(`Error refreshing ${newTab}:`, error);
        toast.error(`Failed to refresh ${newTab}`);
      }
    }
  };


  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-950 text-white flex flex-col fixed inset-0 overflow-hidden">
        <div className="header-container fixed top-0 left-0 right-0 bg-gray-950 z-10">
          <div className="header-inner">
            <div className="flex justify-between items-center h-12">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold">Kitchen Elf</h1>
                
                {/* Desktop Navigation */}
                <div className="hidden sm:flex items-center gap-3">
                  <button
                    onClick={() => handleTabChange('cook')}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                      ${activeTab === 'cook' 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-400 hover:text-gray-300'
                      }
                    `}
                  >
                    <SparklesIcon className="w-5 h-5" />
                    <span>Recipes</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('pantry')}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                      ${activeTab === 'pantry' 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-400 hover:text-gray-300'
                      }
                    `}
                  >
                    <Square3Stack3DIcon className="w-5 h-5" />
                    <span>Pantry</span>
                  </button>

                  <button
                    onClick={() => handleTabChange('cookbook')}
                    className={`
                      flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                      ${activeTab === 'cookbook' 
                        ? 'text-blue-400 bg-blue-500/10' 
                        : 'text-gray-400 hover:text-gray-300'
                      }
                    `}
                  >
                    <BookOpenIcon className="w-5 h-5" />
                    <span>Cookbook</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setIsAccountMenuOpen(!isAccountMenuOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300"
                  >
                    <span>👤</span>
                    <span className="hidden sm:inline">Account</span>
                  </button>

                  {isAccountMenuOpen && (
                    <div
                      id="account-menu"
                      className="absolute right-0 mt-2 w-48 bg-gray-900 rounded-lg shadow-lg py-1"
                    >
                      <Link
                        href="/profile"
                        className="block w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAccountMenuOpen(false);
                        }}
                      >
                        Profile Settings
                      </Link>
                      
                      <Link
                        href="/onboarding"
                        className="block w-full px-4 py-2 text-left text-indigo-400 hover:bg-indigo-950/50 text-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAccountMenuOpen(false);
                        }}
                      >
                        Repeat Onboarding
                      </Link>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSignOut();
                        }}
                        className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-950/50 text-sm border-t border-gray-800"
                      >
                        Sign Out
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsAccountMenuOpen(false);
                          setShowFeedbackModal(true);
                        }}
                        className="w-full px-4 py-2 text-left text-gray-300 hover:bg-gray-800 text-sm"
                      >
                        Share Feedback
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main scrollable content area */}
        <div className="flex-1 overflow-y-auto -webkit-overflow-scrolling-touch mt-12 pb-16">
          {activeTab === 'cook' && <RecipesTab pantryItems={pantryItems} loading={isLoading} />}
          {activeTab === 'pantry' && <PantryTab />}
          {activeTab === 'cookbook' && <CookbookTab />}
        </div>

        {/* Fixed bottom navigation for mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 pb-safe z-10">
          <div className="flex justify-around items-center h-16">
            <button
              onClick={() => handleTabChange('cook')}
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                activeTab === 'cook' ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <SparklesIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Recipes</span>
            </button>

            <button
              onClick={() => handleTabChange('pantry')}
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                activeTab === 'pantry' ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <Square3Stack3DIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Pantry</span>
            </button>

            <button
              onClick={() => handleTabChange('cookbook')}
              className={`flex flex-col items-center justify-center flex-1 py-2 ${
                activeTab === 'cookbook' ? 'text-blue-400' : 'text-gray-400'
              }`}
            >
              <BookOpenIcon className="w-6 h-6" />
              <span className="text-xs mt-1">Cookbook</span>
            </button>
          </div>
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
          <ElfModal onClose={() => setShowElfModal(false)} pantryItemsCount={pantryItems.length} />
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
              } catch  {
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

        {showFeedbackModal && (
          <FeedbackModal onClose={() => setShowFeedbackModal(false)} />
        )}
      </main>
    </AuthGuard>
  );
}
