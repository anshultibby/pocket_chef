export const ERROR_MESSAGES = {
  RECEIPT_PROCESSING: 'Failed to process receipt',
  UPDATE_ITEM: 'Failed to update item',
  DELETE_ITEM: 'Failed to delete item',
  CLEAR_PANTRY: 'Failed to clear pantry',
  GENERIC: 'An unexpected error occurred',
  NETWORK: 'Network error occurred',
  AUTH: 'Authentication error',
} as const;

export const SUCCESS_MESSAGES = {
  ITEM_ADDED: 'Item added successfully',
  ITEM_UPDATED: 'Item updated successfully',
  ITEM_DELETED: 'Item deleted successfully',
  PANTRY_CLEARED: 'Pantry cleared successfully',
} as const;
