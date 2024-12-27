import { create } from 'zustand';
import { PantryItemCreate } from '@/types';
import { pantryApi } from '@/lib/api';


interface ReceiptStore {
  isUploading: boolean;
  receiptImage: string | null;
  pendingItems: PantryItemCreate[];
  error: string | null;
  showConfirmation: boolean;
  uploadState: 'idle' | 'uploading' | 'confirming';
  
  // Actions
  handleFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  clearUpload: () => void;
  setShowConfirmation: (show: boolean) => void;
  setError: (error: string | null) => void;
  setUploadState: (state: 'idle' | 'uploading' | 'confirming') => void;
}

export const useReceiptStore = create<ReceiptStore>((set) => ({
  isUploading: false,
  receiptImage: null,
  pendingItems: [],
  error: null,
  showConfirmation: false,
  uploadState: 'idle',

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

  clearUpload: () => {
    set({
      receiptImage: null,
      pendingItems: [],
      error: null,
      showConfirmation: false,
      uploadState: 'idle'
    });
  },

  setShowConfirmation: (show) => set({ showConfirmation: show }),
  setError: (error) => set({ error }),
  setUploadState: (state) => set({ uploadState: state })
}));
