import { useState } from 'react';
import { PantryItem } from '@/types';
import { pantryApi } from '@/lib/api';

interface PantryTabProps {
  pantryItems: PantryItem[];
  onAddItems: (items: PantryItem[]) => void;
  onUpdateItem: (id: string, updates: Partial<PantryItem>) => void;
  onDeleteItem: (id: string) => void;
}

export default function PantryTab({
  pantryItems,
  onAddItems,
  onUpdateItem,
  onDeleteItem
}: PantryTabProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);

    try {
      // Create FormData with the exact field name expected by FastAPI
      const formData = new FormData();
      formData.append('file', file, file.name); // Include filename

      // Upload the receipt using formData
      const parsedItems = await pantryApi.uploadReceipt(formData);
      
      // Then add the items to the pantry
      const addedItems = await pantryApi.addItems(parsedItems);
      onAddItems(addedItems);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to process receipt';
      setError(message);
      console.warn('Receipt upload error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = async (item: PantryItem, change: number) => {
    const newQuantity = Math.max(0, item.quantity + change);
    if (newQuantity === item.quantity) return;

    try {
      await onUpdateItem(item.id, { quantity: newQuantity });
    } catch (err) {
      setError('Failed to update quantity');
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">My Pantry</h2>
        <div>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
            id="receipt-upload"
            disabled={loading}
          />
          <label
            htmlFor="receipt-upload"
            className={`px-4 py-2 rounded cursor-pointer ${
              loading 
                ? 'bg-gray-500 text-gray-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? 'Processing...' : 'Upload Receipt'}
          </label>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Items Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pantryItems.map((item) => (
          <div
            key={item.id}
            className="p-4 border border-gray-700 rounded-lg bg-gray-800 hover:bg-gray-750 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-white">{item.name}</h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <p>
                    {item.quantity} {item.unit}
                    {item.category && ` • ${item.category}`}
                  </p>
                  {item.expiry_date && (
                    <p>Expires: {new Date(item.expiry_date).toLocaleDateString()}</p>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleQuantityChange(item, -1)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  -
                </button>
                <button
                  onClick={() => handleQuantityChange(item, 1)}
                  className="p-1 text-gray-400 hover:text-white"
                >
                  +
                </button>
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {pantryItems.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No items in your pantry.</p>
          <p className="text-sm">Upload a receipt to get started!</p>
        </div>
      )}
    </div>
  );
}
