import { useState } from 'react';
import { PantryItem, PantryItemCreate } from '@/types';
import { normalizeString } from '@/utils/pantry';
import { pantryApi } from '@/lib/api';
import { PantryItemFormValues } from '@/schemas/pantry';

type DuplicateItem = {
  existing: PantryItem;
  new: PantryItemCreate;
};

type DuplicateResolutionAction = 'merge' | 'mergeEdit' | 'create';

export function useDuplicateHandler(
  pantryItems: PantryItem[],
  onAddItems: (items: PantryItemCreate[]) => Promise<void>,
  onUpdateItem: (id: string, updates: Partial<PantryItemCreate>) => Promise<void>
) {
  const [duplicateItem, setDuplicateItem] = useState<DuplicateItem | null>(null);
  const [pendingItems, setPendingItems] = useState<PantryItemCreate[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const checkForDuplicate = (item: PantryItemCreate): PantryItem | undefined => {
    return pantryItems.find(existing => 
      normalizeString(existing.data.name) === normalizeString(item.data.name)
    );
  };

  const handleSingleItem = async (item: PantryItemCreate) => {
    const existingItem = checkForDuplicate(item);

    if (existingItem) {
      setDuplicateItem({ existing: existingItem, new: item });
      setPendingItems([item]);
    } else {
      const [addedItem] = await pantryApi.addItems([item]);
      onAddItems([addedItem]);
    }
  };

  const handleMultipleItems = async (items: PantryItemCreate[]) => {
    if (items.length === 0) return;
    
    const firstItem = items[0];
    const existingItem = checkForDuplicate(firstItem);

    if (existingItem) {
      setDuplicateItem({ existing: existingItem, new: firstItem });
      setPendingItems(items);
    } else {
      const [addedItem] = await pantryApi.addItems([firstItem]);
      onAddItems([addedItem]);
      
      if (items.length > 1) {
        setPendingItems(items.slice(1));
        await handleMultipleItems(items.slice(1));
      }
    }
  };

  const handleDuplicateResolution = async (action: DuplicateResolutionAction) => {
    if (!duplicateItem || !pendingItems.length) return;
    setIsProcessing(true);

    try {
      switch (action) {
        case 'mergeEdit':
          const mergedEditData: PantryItemCreate = {
            data: {
              ...duplicateItem.existing.data,
              quantity: (duplicateItem.existing.data.quantity || 0) + 
                       (duplicateItem.new.data.quantity || 0)
            },
            nutrition: duplicateItem.existing.nutrition
          };
          await onUpdateItem(duplicateItem.existing.id, mergedEditData);
          setIsEditing(true);
          return mergedEditData;

        case 'merge':
          const mergedData: PantryItemCreate = {
            data: {
              ...duplicateItem.existing.data,
              quantity: (duplicateItem.existing.data.quantity || 0) + 
                       (duplicateItem.new.data.quantity || 0)
            },
            nutrition: duplicateItem.existing.nutrition
          };
          await onUpdateItem(duplicateItem.existing.id, mergedData);
          
          // Process remaining items
          const remainingItemsAfterMerge = pendingItems.slice(1);
          if (remainingItemsAfterMerge.length > 0) {
            setDuplicateItem(null);
            setPendingItems(remainingItemsAfterMerge);
            await handleMultipleItems(remainingItemsAfterMerge);
          } else {
            clearDuplicates();
          }
          break;

        case 'create':
          const [addedItem] = await pantryApi.addItems([duplicateItem.new]);
          onAddItems([addedItem]);
          
          // Process remaining items
          const remainingItemsAfterCreate = pendingItems.slice(1);
          if (remainingItemsAfterCreate.length > 0) {
            setDuplicateItem(null);
            setPendingItems(remainingItemsAfterCreate);
            await handleMultipleItems(remainingItemsAfterCreate);
          } else {
            clearDuplicates();
          }
          break;
      }
    } catch (error) {
      clearDuplicates();
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditComplete = async () => {
    setIsEditing(false);
    const remainingItems = pendingItems.slice(1);
    if (remainingItems.length > 0) {
      setDuplicateItem(null);
      setPendingItems(remainingItems);
      await handleMultipleItems(remainingItems);
    } else {
      clearDuplicates();
    }
  };

  const clearDuplicates = () => {
    if (!isProcessing && !isEditing) {
      setDuplicateItem(null);
      setPendingItems([]);
    }
  };

  return {
    duplicateItem,
    handleSingleItem,
    handleMultipleItems,
    handleDuplicateResolution,
    handleEditComplete,
    isProcessing,
    isEditing,
    clearDuplicates
  };
}
