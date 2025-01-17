import { create } from 'zustand';
import { PantryItem, PantryItemCreate } from '@/types';
import { pantryApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { usePantryStore } from './pantryStore';

type DuplicateItem = {
  existing: PantryItem;
  new: PantryItemCreate;
};

interface DuplicateStore {
  // State
  duplicateItem: DuplicateItem | null;
  pendingDuplicates: DuplicateItem[];
  isProcessing: boolean;
  isEditing: boolean;
  
  // Actions
  setDuplicateItem: (item: DuplicateItem | null) => void;
  setPendingDuplicates: (items: DuplicateItem[]) => void;
  setIsProcessing: (value: boolean) => void;
  setIsEditing: (value: boolean) => void;
  
  // Complex actions
  handleItems: (
    itemsToProcess: PantryItemCreate[],
    pantryItems: PantryItem[]
  ) => Promise<void>;
  
  processNextDuplicate: () => void;
  
  handleDuplicateResolution: (
    action: 'merge' | 'mergeEdit' | 'create',
    onAddItems: (items: PantryItem[]) => void,
    onUpdateItem: (id: string, updates: Partial<PantryItem>) => void
  ) => Promise<void>;
  
  handleEditComplete: (
    updatedItem: PantryItemCreate,
    onUpdateItem: (id: string, updates: Partial<PantryItem>) => void
  ) => Promise<void>;
  
  clearDuplicates: () => void;
}

export const useDuplicateStore = create<DuplicateStore>((set, get) => ({
  duplicateItem: null,
  pendingDuplicates: [],
  isProcessing: false,
  isEditing: false,

  setDuplicateItem: (item) => set({ duplicateItem: item }),
  setPendingDuplicates: (items) => set({ pendingDuplicates: items }),
  setIsProcessing: (value) => set({ isProcessing: value }),
  setIsEditing: (value) => set({ isEditing: value }),

  handleItems: async (itemsToProcess, pantryItems) => {
    const duplicates: DuplicateItem[] = [];
    const newItems: PantryItemCreate[] = [];

    itemsToProcess.forEach(item => {
      const duplicate = pantryItems.find(
        existing => existing.data.name.toLowerCase() === item.data.name.toLowerCase()
      );
      if (duplicate) {
        duplicates.push({ existing: duplicate, new: item });
      } else {
        newItems.push(item);
      }
    });

    // Add new items first if there are any
    if (newItems.length > 0) {
      try {
        const createdItems = await pantryApi.addItems(newItems);
        await usePantryStore.getState().addItems(createdItems);
      } catch (error) {
        console.error('Error adding new items:', error);
        throw error;
      }
    }

    // Then handle duplicates if any exist
    if (duplicates.length > 0) {
      set({ 
        pendingDuplicates: duplicates,
        duplicateItem: duplicates[0]
      });
    }
  },

  processNextDuplicate: () => {
    const { pendingDuplicates } = get();
    const remainingDuplicates = pendingDuplicates.slice(1);
    
    set({ 
      pendingDuplicates: remainingDuplicates,
      duplicateItem: remainingDuplicates.length > 0 ? remainingDuplicates[0] : null
    });

    if (remainingDuplicates.length === 0) {
      toast.success('All items processed');
    }
  },

  handleEditComplete: async (updatedItem, onUpdateItem) => {
    const { duplicateItem } = get();
    if (!duplicateItem) return;

    try {
      set({ isProcessing: true });
      const updated = await pantryApi.updateItem(duplicateItem.existing.id, updatedItem);
      await onUpdateItem(duplicateItem.existing.id, updated);
      set({ isEditing: false });
      get().processNextDuplicate();
    } catch (error) {
      set({ isProcessing: false });
      throw error;
    }
  },

  clearDuplicates: () => set({
    duplicateItem: null,
    pendingDuplicates: [],
    isProcessing: false,
    isEditing: false
  }),

  handleDuplicateResolution: async (action, onAddItems, onUpdateItem) => {
    const { duplicateItem } = get();
    if (!duplicateItem || get().isProcessing) return;
    set({ isProcessing: true });

    try {
      switch (action) {
        case 'merge': {
          const updates = {
            data: {
              ...duplicateItem.existing.data,
              quantity: duplicateItem.existing.data.quantity + duplicateItem.new.data.quantity
            }
          };
          const updatedItem = await pantryApi.updateItem(duplicateItem.existing.id, updates);
          await onUpdateItem(duplicateItem.existing.id, updatedItem);
          get().processNextDuplicate();
          break;
        }
        case 'mergeEdit':
          set({ isEditing: true, isProcessing: false }); // Allow editing
          break;
        case 'create': {
          const [createdItem] = await pantryApi.addItems([duplicateItem.new]);
          await onAddItems([createdItem]);
          get().processNextDuplicate();
          break;
        }
      }
    } catch (error) {
      console.error('Error resolving duplicate:', error);
      throw error;
    } finally {
      if (action !== 'mergeEdit') {
        set({ isProcessing: false });
      }
    }
  }
}));
