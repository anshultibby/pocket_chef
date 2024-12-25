import { create } from 'zustand';
import { PantryItem, PantryItemCreate, PantryItemUpdate } from '@/types';
import { PantryItemFormValues } from '@/schemas/pantry';
import { pantryApi } from '@/lib/api';

interface PantryStore {
  items: PantryItem[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchItems: () => Promise<void>;
  addItem: (item: PantryItemCreate) => Promise<void>;
  updateItem: (id: string, updates: PantryItemUpdate) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  clearPantry: () => Promise<void>;
  addItems: (items: PantryItemCreate[]) => Promise<void>;
}

export const roundQuantity = (value: number): number => {
  // Round to 2 decimal places
  return Math.round(value * 100) / 100;
};

export const usePantryStore = create<PantryStore>((set, get) => ({
  items: [],
  isLoading: false,
  error: null,

  fetchItems: async () => {
    set({ isLoading: true, error: null });
    try {
      const items = await pantryApi.getItems();
      set({ items, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to fetch items', isLoading: false });
    }
  },

  addItem: async (formValues) => {
    try {
      const newItem = await pantryApi.createItem(formValues);
      set(state => ({ items: [...state.items, newItem] }));
    } catch (error) {
      set({ error: 'Failed to add item' });
      throw error;
    }
  },

  updateItem: async (id, updates) => {
    try {
      const updatedItem = await pantryApi.updateItem(id, updates);
      set(state => ({
        items: state.items.map(item => 
          item.id === id ? updatedItem : item
        )
      }));
    } catch (error) {
      set({ error: 'Failed to update item' });
      throw error;
    }
  },

  deleteItem: async (id) => {
    try {
      await pantryApi.deleteItem(id);
      set(state => ({
        items: state.items.filter(item => item.id !== id)
      }));
    } catch (error) {
      set({ error: 'Failed to delete item' });
    }
  },

  clearPantry: async () => {
    try {
      await pantryApi.clearPantry();
      set({ items: [] });
    } catch (error) {
      set({ error: 'Failed to clear pantry' });
    }
  },

  addItems: async (items) => {
    try {
      const newItems = await Promise.all(
        items.map(item => pantryApi.createItem(item))
      );
      set(state => ({ items: [...state.items, ...newItems] }));
    } catch (error) {
      set({ error: 'Failed to add items' });
    }
  }
}));
