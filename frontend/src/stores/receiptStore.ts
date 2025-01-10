import { create } from 'zustand';
import { PantryItemCreate } from '@/types';
import { pantryApi } from '@/lib/api';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { userApi } from '@/lib/api/userApi';

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

export const useReceiptStore = create<ReceiptStore>((set) => {
  const processFile = async (file: File) => {
    set({ isUploading: true, error: null });

    try {
      const imageUrl = URL.createObjectURL(file);
      set({ receiptImage: imageUrl });

      const items = await userApi.processFile(file);
      set({ 
        pendingItems: items, 
        showConfirmation: true 
      });
      
      return true;
    } catch (err: unknown) {
      set({ error: 'Failed to process receipt' });
      console.error('Receipt upload error:', err);
      return false;
    } finally {
      set({ isUploading: false });
    }
  };

  return {
    isUploading: false,
    receiptImage: null,
    pendingItems: [],
    error: null,
    showConfirmation: false,
    uploadState: 'idle',

    handleFileUpload: async (event) => {
      // For iOS/Android native apps
      if (Capacitor.isNativePlatform()) {
        try {
          const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Uri,
            source: CameraSource.Prompt
          });

          // Convert the image to a file
          const response = await fetch(image.webPath!);
          const blob = await response.blob();
          const file = new File([blob], 'receipt.jpg', { type: 'image/jpeg' });

          return processFile(file);
        } catch (err: unknown) {
          // Don't show error if user just cancelled
          if (err instanceof Error && err.message !== 'User cancelled photos app') {
            set({ error: 'Failed to process receipt' });
            console.error('Camera error:', err);
          }
          return false;
        }
      }
      
      // For web browsers
      const file = event.target.files?.[0];
      if (!file) return false;
      
      return processFile(file);
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
  };
});
