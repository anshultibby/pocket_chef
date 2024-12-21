import { useState, useRef } from 'react';
import { 
  PantryItemWithIngredient, 
  PantryItemCreate, 
  PantryItemUpdate 
} from '@/types';
import { pantryApi } from '@/lib/api';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';
import CategoryFilters from './pantry/CategoryFilters';
import PantryControls from './pantry/PantryControls';
import PantryGrid from './pantry/PantryGrid';
import AddItemModal from './modals/AddItemModal';
import ItemEditModal from './modals/ItemEditModal';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { useFileUpload } from '@/hooks/useFileUpload';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { ErrorMessage } from '@/components/shared/ErrorMessage';
import { ERROR_MESSAGES } from '@/constants/messages';
import { normalizeString } from '@/utils/pantry';

interface PantryTabProps {
  pantryItems: PantryItemWithIngredient[];
  loading: boolean;
  onAddItems: (items: PantryItemWithIngredient[]) => void;
  onUpdateItem: (id: string, updates: Partial<PantryItemWithIngredient>) => void;
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<PantryItemWithIngredient | null>(null);

  if (loading) {
    return <LoadingSpinner message="Loading pantry items..." />;
  }

  const handleItemUpdate = async (
    item: PantryItemWithIngredient, 
    updates: PantryItemUpdate
  ) => {
    try {
      const updatedItem = await pantryApi.updateItem(item.id, updates);
      onUpdateItem(item.id, updatedItem);
      setSelectedItem(updatedItem);
    } catch (err) {
      handleError(err);
    }
  };

  const handleModalUpdate = (updates: Partial<PantryItemUpdate>) => {
    if (!selectedItem) return;
    handleItemUpdate(selectedItem, {
      data: updates.data || {}
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
      setSelectedCategory(null);
      setSearchTerm('');
    } catch (err) {
      handleError(err);
    }
  };

  const handleAddItem = async (item: PantryItemCreate) => {
    try {
      const existingItem = pantryItems.find(
        existing => 
          normalizeString(existing.data.display_name) === normalizeString(item.data.display_name) &&
          normalizeString(existing.data.unit) === normalizeString(item.data.unit)
      );

      if (existingItem) {
        const updatedItem = await pantryApi.updateItem(existingItem.id, {
          data: {
            ...existingItem.data,
            quantity: existingItem.data.quantity + item.data.quantity
          }
        });
        onUpdateItem(existingItem.id, updatedItem);
      } else {
        const [addedItem] = await pantryApi.addItems([item]);
        onAddItems([addedItem]);
      }
      setShowAddItemForm(false);
    } catch (err) {
      handleError(err);
    }
  };

  const handleConfirmReceiptItems = async (confirmedItems: PantryItemCreate[]) => {
    try {
      const formattedItems = confirmedItems.map(item => ({
        data: {
          display_name: item.data.display_name,
          quantity: Number(item.data.quantity),
          unit: item.data.unit || 'units',
          notes: item.data.notes || '',
          expiry_date: item.data.expiry_date || undefined,
        }
      }));

      const savedItems = await pantryApi.addItems(formattedItems);
      onAddItems(savedItems);
      
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
  };

  const handleUploadReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const success = await handleFileUpload(event);
    if (success) {
      setShowReceiptConfirmation(true);
    }
  };

  const groupedItems = pantryItems
    .filter(item => {
      const matchesSearch = item.data.display_name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.data.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .reduce((groups, item) => {
      const category = item.data.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {} as Record<string, PantryItemWithIngredient[]>);

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
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
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

      {showReceiptConfirmation && (
        <ReceiptConfirmation
          items={pendingItems}
          receiptImage={receiptImage}
          onConfirm={handleConfirmReceiptItems}
          onCancel={handleCloseConfirmation}
        />
      )}

      {selectedItem && (
        <ItemEditModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={handleModalUpdate}
        />
      )}
    </div>
  );
}
