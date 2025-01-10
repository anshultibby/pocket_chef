import { pantryApi } from '@/lib/api';
import { track } from '@vercel/analytics';

export const userApi = {
  async processFile(file: File) {
    const formData = new FormData();
    formData.append('file', file, file.name);

    try {
      const items = await pantryApi.receipt.process(formData);
      
      track('receipt_upload', {
        fileSize: Math.round(file.size / 1024),
        fileType: file.type,
        itemsExtracted: items.length,
        success: true
      });
      
      return items;
    } catch (err) {
      track('receipt_upload_error', {
        fileSize: Math.round(file.size / 1024),
        fileType: file.type,
        error: err instanceof Error ? err.message : 'Unknown error'
      });
      throw err;
    }
  }
}; 