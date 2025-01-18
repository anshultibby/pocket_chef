import { pantryApi } from '@/lib/api';
import { PantryItemCreate } from '@/types';
import { track } from '@vercel/analytics';

interface FileUploadAPI {
  processFile(inputFile: Blob): Promise<PantryItemCreate[]>;
}

export const userApi: FileUploadAPI = {
  async processFile(inputFile: Blob) {
    // Ensure we have an image file
    if (!inputFile.type.startsWith('image/')) {
      throw new Error('Please upload an image file');
    }

    const formData = new FormData();
    
    // Create a new File object from the Blob
    const file = new File([inputFile], 'receipt.jpg', { 
      type: inputFile.type,
      lastModified: Date.now()
    });
    
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