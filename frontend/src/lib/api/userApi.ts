import { pantryApi } from '@/lib/api';
import { track } from '@vercel/analytics';

export const userApi = {
  async processFile(file: File) {
    if (!file.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await pantryApi.receipt.process(formData);
      
      track('receipt_upload', {
        fileSize: Math.round(file.size / 1024),
        fileType: file.type,
        itemsExtracted: response.length,
        success: true
      });
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process receipt';
      
      track('receipt_upload_error', {
        fileSize: Math.round(file.size / 1024),
        fileType: file.type,
        error: errorMessage
      });
      
      throw new Error(errorMessage);
    }
  }
}; 