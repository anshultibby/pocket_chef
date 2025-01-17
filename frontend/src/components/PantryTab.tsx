import { useState, useRef } from 'react';
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
  FunnelIcon
} from '@heroicons/react/24/outline';
import { Capacitor } from '@capacitor/core';

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
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  if (isLoading) {
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
    if (!event) return;
    
    try {
      const success = await handleWebUpload(event);
      if (success) {
        useReceiptStore.getState().setShowConfirmation(true);
      }
    } catch (error) {
      handleError(error);
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

  return (
    <div className="space-y-6">
      {(error || uploadError) && (
        <ErrorMessage 
          message={error || uploadError || ERROR_MESSAGES.GENERIC} 
          onDismiss={clearError}
        />
      )}

      {/* Mobile Controls */}
      <div className="sm:hidden">
        {showSearch && (
          <div className="relative w-full animate-slideDown mb-2">
            <input
              type="text"
              placeholder="Search items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-gray-800/50 rounded-lg px-4 py-2 text-white w-full focus:ring-2 ring-blue-500 focus:outline-none text-base"
              autoFocus
            />
            <button 
              onClick={() => {
                setShowSearch(false);
                setSearchTerm(''); // Clear search when closing
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}
        
        <div className="flex gap-2 justify-start">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              showFilters 
                ? 'bg-blue-600/20 text-blue-400' 
                : 'bg-gray-800/50 text-gray-400 hover:text-white'
            }`}
          >
            <FunnelIcon className="w-5 h-5" />
          </button>
          
          <button
            onClick={() => setShowSearch(true)}
            className="w-10 h-10 rounded-full bg-gray-800/50 text-gray-400 hover:text-white flex items-center justify-center"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => setShowAddItemForm(true)}
            className="w-10 h-10 rounded-full bg-green-600/20 text-green-400 hover:bg-green-600/30 flex items-center justify-center"
          >
            <PlusIcon className="w-5 h-5" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isUploading 
                ? 'bg-gray-700/50 text-gray-400' 
                : 'bg-blue-600/20 text-blue-400 hover:bg-blue-600/30'
            }`}
          >
            {isUploading ? 
              <ArrowPathIcon className="w-5 h-5 animate-spin" /> : 
              <DocumentArrowUpIcon className="w-5 h-5" />
            }
          </button>

          <button
            onClick={handleClearPantry}
            disabled={pantryItems.length === 0}
            className="w-10 h-10 rounded-full bg-red-900/20 text-red-300/70 hover:bg-red-900/30 disabled:opacity-50 flex items-center justify-center"
          >
            <TrashIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Desktop Controls */}
      <div className="hidden sm:block">
        <PantryControls
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onAddItem={() => setShowAddItemForm(true)}
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

      <PantryGrid
        groupedItems={sortedGroupedItems}
        onSelectItem={setSelectedItem}
      />

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
            } catch (error) {
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
          onChange={handleWebUpload}
          className="hidden"
          accept="image/*"
        />
      )}
    </div>
  );
}
