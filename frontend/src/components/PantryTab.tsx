import { useState, useRef } from 'react';
import { 
  PantryItem, 
  PantryItemCreate, 
} from '@/types';
import { pantryApi } from '@/lib/api';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import CategoryFilters from './pantry/CategoryFilters';
import PantryControls from './pantry/PantryControls';
import PantryGrid from './pantry/PantryGrid';
import AddItemModal from '@/components/modals/AddItemModal';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useFileUpload } from '@/hooks/useFileUpload';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { ERROR_MESSAGES } from '@/constants/messages';
import { DuplicateItemModal } from './modals/DuplicateItemModal';
import { useDuplicateHandler } from '@/hooks/useDuplicateHandler';
import { usePantryStore } from '@/stores/pantryStore';

export default function PantryTab() {
  const { 
    items: pantryItems, 
    isLoading, 
    addItems, 
    updateItem, 
    deleteItem 
  } = usePantryStore();

  const { error, handleError, clearError } = useErrorHandler();
  const {
    isUploading,
    receiptImage,
    pendingItems: uploadPendingItems,
    error: uploadError,
    handleFileUpload,
    clearUpload,
  } = useFileUpload();

  const {
    duplicateItem,
    handleSingleItem,
    handleMultipleItems,
    handleDuplicateResolution,
    handleEditComplete,
    isProcessing,
    isEditing,
    clearDuplicates
  } = useDuplicateHandler(pantryItems, addItems, updateItem);

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);

  if (isLoading) {
    return <LoadingSpinner message="Loading pantry items..." />;
  }

  const handleReceiptConfirmation = async (confirmedItems: PantryItemCreate[]) => {
    try {
      await handleMultipleItems(confirmedItems);
      setShowReceiptConfirmation(false);
      if (clearUpload) {
        clearUpload();
      }
    } catch (error) {
      handleError(error);
      setShowReceiptConfirmation(false);
    }
  };

  // Handle single item addition
  const handleAddItem = async (item: PantryItemCreate) => {
    try {
      await handleSingleItem(item);
    } catch (error) {
      handleError(error);
    }
  };

  const handleClearPantry = async () => {
    if (!confirm('Are you sure you want to clear all items from your pantry?')) {
      return;
    }

    try {
      await pantryApi.clearPantry();
      addItems([]);
      setSelectedCategories([]);
      setSearchTerm('');
      setSelectedItem(null);
      clearError();
      
      if (clearUpload) {
        clearUpload();
      }
    } catch (err) {
      handleError(err);
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
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(item.data.category || 'Other');
      return matchesSearch && matchesCategory;
    })
    .reduce((groups, item) => {
      const category = item.data.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {} as Record<string, PantryItem[]>);

  const categories = Array.from(new Set(pantryItems.map(item => item.data.category || 'Other')));

  const handleUploadReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      await handleFileUpload(event);
      setShowReceiptConfirmation(true);
    } catch (error) {
      handleError(error);
    }
  };

  const handleCloseConfirmation = () => {
    setShowReceiptConfirmation(false);
    if (clearUpload) {
      clearUpload();
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteItem(id);
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
    try {
      const mergedItem = await handleDuplicateResolution('mergeEdit');
      if (mergedItem) {
        setEditingItem(mergedItem);
      }
    } catch (error) {
      handleError(error);
    }
  };

  const handleEditModalClose = async (updates?: Partial<PantryItem>) => {
    if (updates) {
      await updateItem(editingItem!.id, updates);
    }
    setEditingItem(null);
    await handleEditComplete();
  };

  return (
    <div className="space-y-6">
      {(error || uploadError) && (
        <ErrorMessage 
          message={error || uploadError || ERROR_MESSAGES.GENERIC} 
          onDismiss={clearError}
        />
      )}

      <PantryControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddItem={() => setShowAddItemForm(true)}
        onUploadReceipt={handleUploadReceipt}
        onClearPantry={handleClearPantry}
        isUploading={isUploading}
        fileInputRef={fileInputRef}
        pantryItemsCount={pantryItems.length}
      />

      <CategoryFilters
        categories={categories}
        selectedCategories={selectedCategories}
        onSelectCategory={handleCategorySelect}
        onClearCategories={() => setSelectedCategories([])}
      />

      <PantryGrid
        groupedItems={groupedItems}
        onSelectItem={setSelectedItem}
      />

      {/* Modals */}
      {showReceiptConfirmation && uploadPendingItems && (
        <ReceiptConfirmation
          items={uploadPendingItems}
          receiptImage={receiptImage}
          onConfirm={handleReceiptConfirmation}
          onCancel={handleCloseConfirmation}
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
          onMergeQuantities={() => handleDuplicateResolution('merge')}
          onMergeAndEdit={handleMergeAndEdit}
          onCreateNew={() => handleDuplicateResolution('create')}
          onCancel={clearDuplicates}
          isProcessing={isProcessing}
        />
      )}

      {editingItem && (
        <AddItemModal
          initialValues={editingItem}
          onAdd={handleEditModalClose}
          onClose={() => handleEditModalClose()}
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
    </div>
  );
}
