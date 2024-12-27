import { create } from 'zustand';
import { PantryItemCreate } from '@/types';
import { pantryApi } from '@/lib/api';
import { pantryStore } from './pantryStore';

interface ReceiptStore {
  isUploading: boolean;
  receiptImage: string | null;
  pendingItems: PantryItemCreate[];
  error: string | null;
  showConfirmation: boolean;
  
  // Actions
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  confirmItems: (items: PantryItemCreate[]) => Promise<void>;
  clearUpload: () => void;
  setShowConfirmation: (show: boolean) => void;
  setError: (error: string | null) => void;
}

export const useReceiptStore = create<ReceiptStore>((set, get) => ({
  isUploading: false,
  receiptImage: null,
  pendingItems: [],
  error: null,
  showConfirmation: false,

  handleFileUpload: async (event) => {
    const file = event.target.files?.[0];
    if (!file) return false;

    set({ isUploading: true, error: null });

    try {
      const formData = new FormData();
      formData.append('file', file, file.name);

      const imageUrl = URL.createObjectURL(file);
      set({ receiptImage: imageUrl });

      const items = await pantryApi.receipt.process(formData);
      set({ pendingItems: items, showConfirmation: true });
      
      event.target.value = '';
      return true;
    } catch (err) {
      set({ error: 'Failed to process receipt' });
      console.error('Receipt upload error:', err);
      return false;
    } finally {
      set({ isUploading: false });
    }
  },

  confirmItems: async (items) => {
    try {
      await pantryApi.addItems(items);
      await pantryStore.getState().fetchItems();
      get().clearUpload();
    } catch (error) {
      set({ error: 'Failed to add items' });
      throw error;
    }
  },

  clearUpload: () => {
    set({
      receiptImage: null,
      pendingItems: [],
      error: null,
      showConfirmation: false
    });
  },

  setShowConfirmation: (show) => set({ showConfirmation: show }),
  setError: (error) => set({ error })
}));
