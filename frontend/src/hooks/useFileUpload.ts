import { useState } from 'react';
import { PantryItemCreate } from '@/types';
import { pantryApi } from '@/lib/api';
import { ERROR_MESSAGES } from '@/constants/messages';

export const useFileUpload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<PantryItemCreate[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return false;

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const imageUrl = URL.createObjectURL(file);
      setReceiptImage(imageUrl);

      const items = await pantryApi.uploadReceipt(formData);
      setPendingItems(items);
      return true;
    } catch (err) {
      setError(ERROR_MESSAGES.RECEIPT_PROCESSING);
      console.error('Receipt upload error:', err);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const clearUpload = () => {
    setReceiptImage(null);
    setPendingItems([]);
    setError(null);
  };

  return {
    isUploading,
    receiptImage,
    pendingItems,
    error,
    handleFileUpload,
    clearUpload,
  };
};
