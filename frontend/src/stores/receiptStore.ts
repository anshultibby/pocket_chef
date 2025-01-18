import { create } from 'zustand';
import { PantryItemCreate } from '@/types';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { userApi } from '@/lib/api/userApi';
import { requestCameraPermissions } from '@/utils/permissions';

interface ReceiptStore {
  isUploading: boolean;
  receiptImage: string | null;
  pendingItems: PantryItemCreate[];
  error: string | null;
  showConfirmation: boolean;
  uploadState: 'idle' | 'uploading' | 'confirming';
  
  // Actions
  handleNativeUpload: () => Promise<boolean>;
  handleWebUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<boolean>;
  clearUpload: () => void;
  setShowConfirmation: (show: boolean) => void;
  setError: (error: string | null) => void;
  setUploadState: (state: 'idle' | 'uploading' | 'confirming') => void;
}

export const useReceiptStore = create<ReceiptStore>((set) => {
  const processFile = async (file: Blob) => {
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

    // Native upload handler
    handleNativeUpload: async () => {
      set({ isUploading: true, error: null });

      try {
        const hasPermissions = await requestCameraPermissions();
        
        if (!hasPermissions) {
          set({ 
            error: 'Camera and photo library access is required to upload receipts. Please enable these permissions in your device settings.' 
          });
          return false;
        }

        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.Base64,
          source: CameraSource.Prompt,
          promptLabelHeader: 'Add Receipt',
          promptLabelPicture: 'Take Photo',
          promptLabelPhoto: 'Choose from Library',
          correctOrientation: true
        });

        // Convert base64 to blob
        const base64Data = image.base64String!;
        const contentType = image.format === 'heic' ? 'image/jpeg' : `image/${image.format}`;
        
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
          const slice = byteCharacters.slice(offset, offset + 1024);
          const byteNumbers = new Array(slice.length);
          
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          byteArrays.push(new Uint8Array(byteNumbers));
        }

        const blob = new Blob(byteArrays, { type: contentType });
        return await processFile(blob);
      } catch (err: unknown) {
        if (err instanceof Error) {
          // Don't show error if user just cancelled
          if (err.message !== 'User cancelled photos app') {
            set({ error: 'Failed to process receipt' });
            console.error('Camera error:', err);
          }
        }
        return false;
      } finally {
        set({ isUploading: false });
      }
    },

    // Web upload handler
    handleWebUpload: async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return false;

      return await processFile(file);
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
