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
      const items = await pantryApi.uploadReceipt(file);
      onAddItems(items);
    } catch (err: unknown) {
      let errorMessage = 'Failed to process receipt';
      
      if (err instanceof TypeError && 
          (err.message.includes('ERR_NAME_NOT_RESOLVED') || 
           err.message.includes('Failed to fetch'))) {
        errorMessage = 'Cannot connect to backend service. Please ensure the backend is running.';
        console.error('Backend connection error:', err);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Receipt upload error:', {
        error: err,
        type: typeof err,
        url: 'localhost:8000'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">My Pantry</h2>
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
            className="bg-blue-600 text-white px-4 py-2 rounded cursor-pointer hover:bg-blue-700"
          >
            {loading ? 'Processing...' : 'Upload Receipt'}
          </label>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pantryItems.map((item) => (
          <div
            key={item.id}
            className="p-4 border border-gray-800 rounded shadow hover:shadow-md transition-shadow bg-gray-900"
          >
            <h3 className="font-semibold text-white">{item.name}</h3>
            <div className="text-sm text-gray-300 space-y-1">
              <p>Quantity: {item.quantity} {item.unit}</p>
              <p>Category: {item.category}</p>
              <p>Expires: {new Date(item.expiry_date).toLocaleDateString()}</p>
            </div>
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={() => onUpdateItem(item.id, { quantity: item.quantity + 1 })}
                className="text-blue-400 hover:text-blue-300"
              >
                +
              </button>
              <button
                onClick={() => onUpdateItem(item.id, { quantity: Math.max(0, item.quantity - 1) })}
                className="text-blue-400 hover:text-blue-300"
              >
                -
              </button>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="text-red-400 hover:text-red-300"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {pantryItems.length === 0 && (
        <div className="text-center text-gray-400 py-8">
          No items in your pantry. Upload a receipt to get started!
        </div>
      )}
    </div>
  );
}
