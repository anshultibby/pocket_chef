import { useState } from 'react';
import { PantryItem } from '@/types';

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
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/pantry/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload receipt');
      }

      const items = await response.json();
      onAddItems(items);
    } catch (err) {
      setError('Failed to process receipt. Please try again.');
      console.error(err);
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
            className="p-4 border rounded shadow hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold">{item.name}</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p>Quantity: {item.quantity} {item.unit}</p>
              <p>Category: {item.category}</p>
              <p>Expires: {new Date(item.expiry_date).toLocaleDateString()}</p>
            </div>
            <div className="mt-2 flex justify-end space-x-2">
              <button
                onClick={() => onUpdateItem(item.id, { 
                  quantity: item.quantity + 1 
                })}
                className="text-blue-600 hover:text-blue-800"
              >
                +
              </button>
              <button
                onClick={() => onUpdateItem(item.id, { 
                  quantity: Math.max(0, item.quantity - 1) 
                })}
                className="text-blue-600 hover:text-blue-800"
              >
                -
              </button>
              <button
                onClick={() => onDeleteItem(item.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {pantryItems.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          No items in your pantry. Upload a receipt to get started!
        </div>
      )}
    </div>
  );
}
