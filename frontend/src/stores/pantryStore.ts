import { create } from 'zustand';
import { PantryItem, PantryItemUpdate } from '@/types';
import { pantryApi } from '@/lib/api';

interface PantryStore {
  // State
  items: PantryItem[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setItems: (items: PantryItem[]) => void;
  addItems: (items: PantryItem[]) => void;
  updateItem: (id: string, updates: Partial<PantryItemUpdate>) => void;
  deleteItem: (id: string) => void;
  
  // Async actions
  fetchItems: () => Promise<void>;
  clearError: () => void;
  reset: () => void;
}

// Export both the store instance and the hook
export const pantryStore = create<PantryStore>((set, get) => ({
  // Initial state
  items: [],
  isLoading: false,
  error: null,

  // Sync actions
  setItems: (items) => set({ items }),
  addItems: (items) => set((state) => ({ 
    items: [...state.items, ...items] 
  })),
  updateItem: (id, updates) => set((state) => ({
    items: state.items.map(item => {
      if (item.id === id) {
        // Round quantity to 2 decimal places if it exists in updates
        const roundedData = updates.data?.quantity 
          ? { 
              ...updates.data, 
              quantity: roundQuantity(updates.data.quantity)
            }
          : updates.data;
        
        return { 
          ...item, 
          data: { ...item.data, ...roundedData }, 
          nutrition: { ...item.nutrition, ...updates.nutrition } 
        };
      }
      return item;
    })
  })),
  deleteItem: async (id: string) => {
    set({ isLoading: true, error: null });
    const previousItems = get().items;
    
    try {
      set((state) => ({
        items: state.items.filter(item => item.id !== id)
      }));
      await pantryApi.deleteItem(id);
      set({ isLoading: false });
    } catch (_error) {
      set({ 
        items: previousItems, 
        error: 'Failed to delete item',
        isLoading: false 
      });
    }
  },

  // Async actions
  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await pantryApi.getItems();
      set({ items, isLoading: false });
    } catch (_error) {
      set({ error: 'Failed to fetch items', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ items: [], isLoading: false, error: null }),
}));

// Keep the hook export for component use
export const usePantryStore = pantryStore;

export const roundQuantity = (value: number): number => {
  return Math.round(value * 100) / 100;
};

