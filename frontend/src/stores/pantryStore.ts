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

export const usePantryStore = create<PantryStore>((set, get) => ({
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
    items: state.items.map(item => 
      item.id === id ? { ...item, data: { ...item.data, ...updates.data }, nutrition: { ...item.nutrition, ...updates.nutrition } } : item
    )
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
    } catch (error) {
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
    } catch (error) {
      set({ error: 'Failed to fetch items', isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({ items: [], isLoading: false, error: null }),
}));
