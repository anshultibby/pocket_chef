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
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { Capacitor } from '@capacitor/core';
import BulkEntryModal from '@/components/modals/BulkEntryModal';
import { FloatingActionMenu } from './pantry/FloatingActionMenu';
import { SearchBar } from './pantry/SearchBar';

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
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showBulkEntry, setShowBulkEntry] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);

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
      const itemCategory = (item.data.category || CATEGORIES.OTHER).toLowerCase();
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(itemCategory);
      const matchesSearch = !searchTerm || 
        item.data.name.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
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

  const handleDeleteItem = async (id: string) => {
    try {
      await pantryApi.deleteItem(id);
      setItems(pantryItems.filter(item => item.id !== id));
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="pb-32 sm:pb-20">
      {/* Main Content */}
      {showFilters && (
        <CategoryFilters
          categories={categories}
          selectedCategories={selectedCategories}
          onSelectCategory={handleCategorySelect}
          onClearCategories={() => setSelectedCategories([])}
        />
      )}

      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <PantryGrid
          groupedItems={sortedGroupedItems}
          onSelectItem={setSelectedItem}
        />
      )}

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onAddItem={() => setShowAddItemForm(true)}
        onBulkAdd={() => setShowBulkEntry(true)}
        onUploadReceipt={() => fileInputRef.current?.click()}
        onToggleSearch={() => setShowSearch(true)}
        isUploading={isUploading}
      />

      {/* Search Bar */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        onClose={() => {
          setShowSearch(false);
          setSearchTerm('');
        }}
        isVisible={showSearch}
      />

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
