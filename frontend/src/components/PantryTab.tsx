import { useState, useRef, useEffect } from 'react';
import { 
  PantryItem, 
  PantryItemCreate, 
} from '@/types';
import { pantryApi } from '@/lib/api';
import CategoryFilters from './pantry/CategoryFilters';
import PantryControls from './pantry/PantryControls';
import PantryGrid from './pantry/PantryGrid';
import AddItemModal from '@/components/modals/AddItemModal';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { ERROR_MESSAGES } from '@/constants/messages';
import { DuplicateItemModal } from './modals/DuplicateItemModal';
import { useDuplicateStore } from '@/stores/duplicateStore';
import { usePantryStore } from '@/stores/pantryStore';
import { CATEGORIES, getCategoryLabel } from '@/constants/categories';
import { useReceiptStore } from '@/stores/receiptStore';
import { track } from '@vercel/analytics';
import { toast } from 'react-hot-toast';
import { 
  PlusIcon, 
  DocumentArrowUpIcon, 
  TrashIcon, 
  ArrowPathIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  TableCellsIcon,
  EllipsisHorizontalIcon
} from '@heroicons/react/24/outline';
import { Capacitor } from '@capacitor/core';
import BulkEntryModal from '@/components/modals/BulkEntryModal';
import { Menu, Transition } from '@headlessui/react';

export default function PantryTab() {
  const { 
    items: pantryItems, 
    isLoading, 
    addItems,
    setItems,
    updateItem,
    fetchItems,
  } = usePantryStore();

  const { error, handleError, clearError } = useErrorHandler();
  const {
    isUploading,
    handleWebUpload,
    error: uploadError,
    clearUpload,
  } = useReceiptStore();

  const {
    duplicateItem,
    isProcessing,
    isEditing,
    handleDuplicateResolution,
    handleEditComplete,
    clearDuplicates,
  } = useDuplicateStore();

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showBulkEntry, setShowBulkEntry] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (isLoading) {
      // Clear any existing errors when loading starts
      if (error) clearError();
      if (uploadError) useReceiptStore.getState().dismissError();
    }
  }, [isLoading, error, uploadError, clearError]);

  if (isLoading && pantryItems.length === 0) {
    return <LoadingSpinner message="Loading pantry items..." />;
  }

  // Simplified single item add
  const handleAddItem = async (item: PantryItemCreate) => {
    try {
      // Use handleItems for single item addition
      await useDuplicateStore.getState().handleItems([item], pantryItems);
    } catch (error) {
      handleError(error);
    }
  };

  const handleClearPantry = async () => {
    if (!confirm('Are you sure you want to clear all items from your pantry?')) {
      return;
    }

    try {
      // First perform the backend operation
      await pantryApi.clearPantry();
      track('clear_pantry', {
        itemCount: pantryItems.length
      });
      
      // Then clear UI state
      setItems([]);
      setSelectedCategories([]);
      setSearchTerm('');
      setSelectedItem(null);
      clearError();

      if (clearUpload) {
        clearUpload();
      }
    } catch (err) {
      handleError(err);
      // Refresh items to ensure UI is in sync with backend
      await fetchItems();
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(category)) {
        return prev.filter(c => c !== category);
      }
      return [...prev, category];
    });
  };

  const groupedItems = pantryItems
    .filter(item => {
      const matchesSearch = item.data.name.toLowerCase().includes(searchTerm.toLowerCase());
      const itemCategory = (item.data.category || CATEGORIES.OTHER).toLowerCase();
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(itemCategory);
      return matchesSearch && matchesCategory;
    })
    .reduce((groups, item) => {
      const category = getCategoryLabel(item.data.category);
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {} as Record<string, PantryItem[]>);

  // Sort categories alphabetically
  const sortedGroupedItems = Object.fromEntries(
    Object.entries(groupedItems).sort(([a], [b]) => a.localeCompare(b))
  );

  const categories = Array.from(new Set(pantryItems.map(item => item.data.category || 'Other')));

  const handleUploadReceipt = async (event?: React.ChangeEvent<HTMLInputElement>) => {
    if (!event?.target?.files?.length) return;
    
    try {
      const success = await handleWebUpload(event);
      if (success) {
        useReceiptStore.getState().setShowConfirmation(true);
      }
    } catch (error) {
      handleError(error);
    } finally {
      // Clear the input value to allow uploading the same file again
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleItemUpdate = async (id: string, updates: Partial<PantryItem>) => {
    try {
      await updateItem(id, updates);
    } catch (error) {
      handleError(error);
    }
  };

  const handleMergeAndEdit = async () => {
    if (duplicateItem) {
      await handleDuplicateResolution('mergeEdit', addItems, updateItem);
    }
  };

  const handleEditModalClose = async (updates?: PantryItemCreate) => {
    try {
      if (updates?.data && duplicateItem) {
        await handleEditComplete(updates, updateItem);
      } else if (updates?.data && selectedItem) {
        await updateItem(selectedItem.id, updates);
      }
    } catch (error) {
      handleError(error);
    } finally {
      setSelectedItem(null);
    }
  };

  const handleBulkAdd = async (items: PantryItemCreate[]) => {
    try {
      await useDuplicateStore.getState().handleItems(items, pantryItems);
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div>
      {isLoading && (
        <div className="fixed top-4 right-4 flex items-center gap-2 bg-blue-500/20 text-blue-300 px-3 py-2 rounded-full">
          <div className="animate-spin w-4 h-4 border-2 border-current border-t-transparent rounded-full" />
          <span className="text-sm">Refreshing...</span>
        </div>
      )}

      {(error || uploadError) && (
        <ErrorMessage 
          message={error || uploadError || ERROR_MESSAGES.GENERIC} 
          onDismiss={clearError}
        />
      )}

      {/* Mobile Controls */}
      <div className="sm:hidden">
        {showSearch && (
          <div className="fixed inset-x-0 bottom-[5.5rem] p-4 bg-gray-900/95 backdrop-blur-sm z-20 animate-slideUp">
            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-gray-800/50 rounded-xl px-4 py-3 text-white w-full focus:ring-2 ring-blue-500 focus:outline-none text-base"
                autoFocus
              />
              <button 
                onClick={() => {
                  setShowSearch(false);
                  setSearchTerm('');
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-2"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Action Bar */}
        <div className={`fixed inset-x-0 bottom-0 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800 z-30 ${Capacitor.getPlatform() === 'ios' ? 'pb-8' : 'pb-safe'}`}>
          <div className="max-w-lg mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={(e) => {
                  e.preventDefault(); // Prevent default to avoid PWA edge issue
                  if (showSearch) {
                    setShowSearch(false);
                    setSearchTerm('');
                  } else {
                    setShowSearch(true);
                    setShowFilters(false); // Close filters if open
                  }
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  showSearch 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
              >
                <MagnifyingGlassIcon className="w-6 h-6" />
              </button>

              <button
                onClick={() => {
                  setShowFilters(!showFilters);
                  setShowSearch(false); // Close search when toggling filters
                  setSearchTerm(''); // Clear search term when closing
                }}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  showFilters 
                    ? 'bg-blue-600/20 text-blue-400' 
                    : 'bg-gray-800/50 text-gray-400 hover:text-white'
                }`}
              >
                <FunnelIcon className="w-6 h-6" />
              </button>

              <button
                onClick={() => {
                  setShowAddItemForm(true);
                  setShowSearch(false); // Close search when opening add form
                  setSearchTerm(''); // Clear search term when closing
                }}
                className="w-12 h-12 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 flex items-center justify-center"
              >
                <PlusIcon className="w-6 h-6" />
              </button>

              <button
                onClick={() => {
                  setShowBulkEntry(true);
                  setShowSearch(false); // Close search when opening bulk entry
                  setSearchTerm(''); // Clear search term when closing
                }}
                className="w-12 h-12 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 flex items-center justify-center"
              >
                <TableCellsIcon className="w-6 h-6" />
              </button>

              <button
                onClick={() => {
                  fileInputRef.current?.click();
                  setShowSearch(false); // Close search when clicking upload
                  setSearchTerm(''); // Clear search term when closing
                }}
                disabled={isUploading}
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isUploading 
                    ? 'bg-gray-700/50 text-gray-400' 
                    : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
                }`}
              >
                {isUploading ? 
                  <ArrowPathIcon className="w-6 h-6 animate-spin" /> : 
                  <DocumentArrowUpIcon className="w-6 h-6" />
                }
              </button>

              <button
                onClick={() => {
                  handleClearPantry();
                  setShowSearch(false); // Close search when clicking clear
                  setSearchTerm(''); // Clear search term when closing
                }}
                disabled={pantryItems.length === 0}
                className="w-12 h-12 rounded-full bg-red-900/20 text-red-300/70 hover:bg-red-900/30 disabled:opacity-50 flex items-center justify-center"
              >
                <TrashIcon className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="relative hidden sm:block mb-8 mt-6">
        <PantryControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddItem={() => setShowAddItemForm(true)}
          onBulkAdd={() => setShowBulkEntry(true)}
          onUploadReceipt={handleUploadReceipt}
          onClearPantry={handleClearPantry}
          isUploading={isUploading}
          fileInputRef={fileInputRef}
          pantryItemsCount={pantryItems.length}
          showSearch={showSearch}
          setShowSearch={setShowSearch}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
        />
      </div>

      {showFilters && (
        <CategoryFilters
          categories={categories}
          selectedCategories={selectedCategories}
          onSelectCategory={handleCategorySelect}
          onClearCategories={() => setSelectedCategories([])}
        />
      )}

      {/* Remove padding top on mobile */}
      <div className="space-y-2">
        <PantryGrid
          groupedItems={sortedGroupedItems}
          onSelectItem={setSelectedItem}
        />
      </div>

      {showAddItemForm && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowAddItemForm(false)}
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
            setShowAddItemForm(false);
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
              setShowAddItemForm(false);
            } catch {
              toast.error('Failed to update item');
              useDuplicateStore.getState().setIsProcessing(false);
            }
          }}
          onClose={() => {
            useDuplicateStore.getState().setIsEditing(false);
            useDuplicateStore.getState().setIsProcessing(false);
            setShowAddItemForm(false);
          }}
          isEditing={true}
        />
      )}

      {selectedItem && (
        <AddItemModal
          initialValues={selectedItem}
          onAdd={async (updatedItem) => {
            await handleItemUpdate(selectedItem.id, updatedItem);
            setSelectedItem(null);
          }}
          onClose={() => setSelectedItem(null)}
          isEditing
        />
      )}

      {/* Only for Web: File Input */}
      {!Capacitor.isNativePlatform() && (
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleUploadReceipt}
          className="hidden"
          accept="image/*"
        />
      )}

      {showBulkEntry && (
        <BulkEntryModal
          onAdd={handleBulkAdd}
          onClose={() => setShowBulkEntry(false)}
        />
      )}
    </div>
  );
}
