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
import { useReceiptStore } from '@/stores/receiptStore';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import { toast } from 'react-hot-toast';
import { useDuplicateStore } from '@/stores/duplicateStore';
import DuplicateItemModal from '@/components/modals/DuplicateItemModal';
import AddItemModal from '@/components/modals/AddItemModal';
import Link from 'next/link';
import { FloatingElfButton } from '@/components/FloatingElfButton';
import FeedbackModal from '@/components/modals/FeedbackModal';
import { SparklesIcon, Square3Stack3DIcon, BookOpenIcon } from '@heroicons/react/24/outline';

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
    
    setActiveTab(newTab);
    localStorage.setItem('activeTab', newTab);

    // Refresh pantry items when switching to pantry tab
    if (newTab === 'pantry') {
      try {
        await usePantryStore.getState().fetchItems();
      } catch (error) {
        console.error('Error refreshing pantry items:', error);
      }
    }

    track('tab_change', {
      from: activeTab,
      to: newTab,
      uploadState
    });
  };


  return (
    <AuthGuard>
      <main className="min-h-screen bg-gray-950 text-white">
        {/* Simplified Header */}
        <div className="fixed top-0 inset-x-0 z-30 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 sm:relative">
          <div className="content-container">
            <div className="flex justify-between items-center h-14">
              <div className="sm:hidden">
                {/* Mobile Title based on active tab */}
                <h1 className="text-lg font-medium">
                  {activeTab === 'pantry' ? 'Pantry' : 
                   activeTab === 'cookbook' ? 'Cookbook' : 'Recipes'}
                </h1>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold">Kitchen Elf</h1>
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

        {/* Tab Content with padding for fixed header on mobile */}
        <div className="pt-14 sm:pt-0">
          <div className="content-container">
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
        </div>

        {/* Bottom Navigation for Mobile */}
        <div className="fixed bottom-0 inset-x-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 sm:hidden">
          <div 
            className="flex justify-around" 
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 0.5rem)', paddingTop: '0.5rem' }}
          >
            <button
              onClick={() => handleTabChange('cook')}
              className={`
                flex flex-col items-center gap-1 px-6 py-1 rounded-lg transition-all
                ${activeTab === 'cook' 
                  ? 'text-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
                }
              `}
            >
              <SparklesIcon className="w-6 h-6" />
              <span className="text-xs font-medium">Recipes</span>
            </button>

            <button
              onClick={() => handleTabChange('pantry')}
              className={`
                flex flex-col items-center gap-1 px-6 py-1 rounded-lg transition-all
                ${activeTab === 'pantry' 
                  ? 'text-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
                }
              `}
            >
              <Square3Stack3DIcon className="w-6 h-6" />
              <span className="text-xs font-medium">Pantry</span>
            </button>

            <button
              onClick={() => handleTabChange('cookbook')}
              className={`
                flex flex-col items-center gap-1 px-6 py-1 rounded-lg transition-all
                ${activeTab === 'cookbook' 
                  ? 'text-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
                }
              `}
            >
              <BookOpenIcon className="w-6 h-6" />
              <span className="text-xs font-medium">Cookbook</span>
            </button>
          </div>
        </div>

        {/* Add Floating Elf Button */}
        {activeTab === 'cook' && (
          <FloatingElfButton
            onClick={() => setShowElfModal(true)}
            pantryItemsCount={pantryItems.length}
          />
        )}

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
