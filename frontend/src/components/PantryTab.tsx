import { useState, useRef } from 'react';
import { 
  PantryItem, 
  PantryItemCreate, 
  PantryItemUpdate 
} from '@/types';
import { pantryApi } from '@/lib/api';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import CategoryFilters from './pantry/CategoryFilters';
import PantryControls from './pantry/PantryControls';
import PantryGrid from './pantry/PantryGrid';
import AddItemModal from './modals/AddItemModal';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useFileUpload } from '@/hooks/useFileUpload';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { ERROR_MESSAGES } from '@/constants/messages';
import { normalizeString } from '@/utils/pantry';
import { DuplicateItemModal } from './modals/DuplicateItemModal';

interface PantryTabProps {
  pantryItems: PantryItem[];
  loading: boolean;
  onAddItems: (items: PantryItem[]) => void;
  onUpdateItem: (id: string, updates: Partial<PantryItem>) => void;
  onDeleteItem: (id: string) => void;
}

export default function PantryTab({
  pantryItems,
  loading,
  onAddItems,
  onUpdateItem,
  onDeleteItem
}: PantryTabProps) {
  const { error, handleError, clearError } = useErrorHandler();
  const {
    isUploading,
    receiptImage,
    pendingItems,
    error: uploadError,
    handleFileUpload,
    clearUpload,
  } = useFileUpload();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [duplicateItem, setDuplicateItem] = useState<{
    existing: PantryItem;
    new: PantryItemCreate;
  } | null>(null);

  if (loading) {
    return <LoadingSpinner message="Loading pantry items..." />;
  }

  const handleItemUpdate = async (
    itemId: string, 
    updates: PantryItemCreate
  ) => {
    try {
      const updatedItem = await pantryApi.updateItem(itemId, {
        data: updates.data,
        nutrition: updates.nutrition
      });
      onUpdateItem(itemId, updatedItem);
      setSelectedItem(null);
    } catch (err) {
      handleError(err);
    }
  };

  const handleModalUpdate = (updates: Partial<PantryItemUpdate>) => {
    if (!selectedItem) return;
    handleItemUpdate(selectedItem.id, {
      data: updates.data || undefined,
      nutrition: updates.nutrition || undefined
    });
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await pantryApi.deleteItem(itemId);
      onDeleteItem(itemId);
    } catch (err) {
      handleError(err);
    }
  };

  const handleClearPantry = async () => {
    if (!confirm('Are you sure you want to clear all items from your pantry?')) {
      return;
    }

    try {
      await pantryApi.clearPantry();
      onAddItems([]);
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

  const handleAddItem = async (item: PantryItemCreate) => {
    try {
      // Check for existing item with same name or standard_name
      const existingItem = pantryItems.find(existing => {
        // Check standard_name only if both items have it
        if (existing.data.standard_name && item.data.standard_name) {
          if (normalizeString(existing.data.standard_name) === normalizeString(item.data.standard_name)) {
            return true;
          }
        }
        
        // Fallback to name comparison
        return normalizeString(existing.data.name) === normalizeString(item.data.name);
      });

      if (existingItem) {
        setDuplicateItem({ existing: existingItem, new: item });
        return;
      }

      await addNewItem(item);
    } catch (err) {
      handleError(err);
    }
  };

  const addNewItem = async (item: PantryItemCreate) => {
    const [addedItem] = await pantryApi.addItems([item]);
    onAddItems([addedItem]);
    setShowAddItemForm(false);
  };

  const handleAddToExisting = async () => {
    if (!duplicateItem) return;

    const updatedQuantity = 
      duplicateItem.existing.data.quantity + duplicateItem.new.data.quantity;

    await handleItemUpdate(duplicateItem.existing.id, {
      data: { ...duplicateItem.existing.data, quantity: updatedQuantity }
    });
    
    setDuplicateItem(null);
    setShowAddItemForm(false);
  };

  const handleConfirmReceiptItems = async (confirmedItems: PantryItemCreate[]) => {
    try {
      // Handle each item one by one
      const savedItems: PantryItem[] = [];
      
      for (const item of confirmedItems) {
        // Check for duplicate
        const existingItem = pantryItems.find(existing => {
          if (existing.data.standard_name && item.data.standard_name) {
            return normalizeString(existing.data.standard_name) === normalizeString(item.data.standard_name);
          }
          return normalizeString(existing.data.name) === normalizeString(item.data.name);
        });

        if (existingItem) {
          // Update existing item with new quantity
          const updatedQuantity = existingItem.data.quantity + item.data.quantity;
          const updatedItem = await pantryApi.updateItem(existingItem.id, {
            data: { ...existingItem.data, quantity: updatedQuantity }
          });
          // Don't add to savedItems since we're using onUpdateItem
          onUpdateItem(existingItem.id, updatedItem);
        } else {
          // Create new item
          const [newItem] = await pantryApi.addItems([item]);
          savedItems.push(newItem);
        }
      }

      // Only call onAddItems for new items
      if (savedItems.length > 0) {
        onAddItems(savedItems);
      }
      
      setShowReceiptConfirmation(false);
      clearUpload();
    } catch (err) {
      handleError(err);
    }
  };

  const handleCloseConfirmation = () => {
    if (receiptImage) {
      URL.revokeObjectURL(receiptImage);
      clearUpload();
    }
    setShowReceiptConfirmation(false);
    
    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUploadReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const success = await handleFileUpload(event);
    if (success) {
      setShowReceiptConfirmation(true);
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
        pantryItems={pantryItems}
      />

      <PantryGrid
        groupedItems={groupedItems}
        onSelectItem={setSelectedItem}
        onDeleteItem={handleDeleteItem}
      />

      {/* Modals */}
      {showAddItemForm && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowAddItemForm(false)}
        />
      )}

      {showReceiptConfirmation && receiptImage && pendingItems && (
        <ReceiptConfirmation
          items={pendingItems}
          receiptImage={receiptImage}
          onConfirm={handleConfirmReceiptItems}
          onCancel={handleCloseConfirmation}
          existingItems={pantryItems}
        />
      )}

      {selectedItem && (
        <AddItemModal
          initialValues={selectedItem}
          onAdd={async (updatedItem) => {
            await handleItemUpdate(selectedItem.id, updatedItem);
          }}
          onClose={() => setSelectedItem(null)}
          isEditing={true}
        />
      )}

      {duplicateItem && (
        <DuplicateItemModal
          existingItem={duplicateItem.existing}
          newItem={duplicateItem.new}
          onEditExisting={() => {
            setSelectedItem(duplicateItem.existing);
            setDuplicateItem(null);
          }}
          onCreateNew={() => {
            addNewItem(duplicateItem.new);
            setDuplicateItem(null);
          }}
          onCancel={() => {
            setDuplicateItem(null);
          }}
        />
      )}
    </div>
  );
}
