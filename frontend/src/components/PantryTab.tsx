import { usePantryStore } from '@/stores/pantryStore';
import { useUIStore } from '@/stores/uiStore';
import CategoryFilters from './pantry/CategoryFilters';
import PantryControls from './pantry/PantryControls';
import PantryGrid from './pantry/PantryGrid';
import ModalManager from './modals/ModalManager';
import { usePantryItems } from '@/hooks/usePantryItems';
import { useRef } from 'react';
import { useDuplicateHandler } from '@/hooks/useDuplicateHandler';
import { pantryApi } from '@/lib/api';
import { CATEGORIES } from '@/constants/categories';
import { PantryItem, PantryItemUpdate } from '@/types';
import { PantryItemFormValues } from '@/schemas/pantry';

export default function PantryTab() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { 
    items, 
    isLoading,
    error,
    addItem,
    updateItem,
    deleteItem,
    clearPantry,
    addItems 
  } = usePantryStore();
  
  const { 
    searchTerm,
    onSearchChange,
    openModal,
    selectedCategories,
    setSelectedCategories
  } = useUIStore();

  const filteredItems = usePantryItems();

  const {
    handleSingleItem,
    handleMultipleItems,
    isProcessing
  } = useDuplicateHandler(
    items,
    addItems,
    async (id: string, updates: PantryItemUpdate) => {
      await updateItem(id, updates);
    }
  );

  const handleUploadReceipt = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('receipt', file);

    try {
      const items = await pantryApi.receipt.process(formData);
      const formattedItems = items.map(item => ({
        data: {
          name: item.data.name,
          original_name: item.data.original_name,
          quantity: item.data.quantity,
          unit: item.data.unit,
          notes: item.data.notes,
          expiry_date: item.data.expiry_date,
          price: item.data.price,
          category: item.data.category
        },
        nutrition: item.nutrition
      }));
      await handleMultipleItems(formattedItems);
    } catch (error) {
      console.error('Failed to process receipt:', error);
    }
  };

  const handleClearCategories = () => {
    setSelectedCategories([]);
  };

  const handleSelectCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setSelectedCategories(selectedCategories.filter(c => c !== category));
    } else {
      setSelectedCategories([...selectedCategories, category]);
    }
  };

  return (
    <div className="space-y-6">
      {isLoading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      
      <PantryControls 
        searchTerm={searchTerm}
        onSearchChange={onSearchChange}
        onAddItem={() => openModal('addItem')}
        onUploadReceipt={handleUploadReceipt}
        onClearPantry={clearPantry}
        isUploading={isProcessing}
        fileInputRef={fileInputRef}
        pantryItemsCount={items.length}
      />

      <CategoryFilters 
        categories={Object.values(CATEGORIES)}
        selectedCategories={selectedCategories}
        onSelectCategory={handleSelectCategory}
        onClearCategories={handleClearCategories}
      />
      
      <PantryGrid 
        items={filteredItems}
        onSelectItem={(item) => openModal('selectedItem', { selectedItem: item })}
        onDeleteItem={deleteItem}
      />

      <ModalManager />
    </div>
  );
}
