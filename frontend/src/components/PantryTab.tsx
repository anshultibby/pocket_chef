import { useState, useEffect } from 'react';
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
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (pantryItems.length === 0) {
      const fetchItems = async () => {
        try {
          const items = await pantryApi.getItems();
          onAddItems(items);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Failed to fetch pantry items';
          setError(message);
          console.warn('Fetch items error:', err);
        }
      };

      fetchItems();
    }
  }, []);

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

  const handleClearPantry = async () => {
    if (!confirm('Are you sure you want to clear all items from your pantry?')) {
      return;
    }

    try {
      await pantryApi.clearPantry();
      onAddItems([]); // Clear the items in the UI
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear pantry';
      setError(message);
      console.warn('Clear pantry error:', err);
    }
  };

  // Group and filter items
  const groupedItems = pantryItems
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .reduce((groups, item) => {
      const category = item.category;
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {} as Record<string, PantryItem[]>);

  // Get unique categories for filter
  const categories = Array.from(new Set(pantryItems.map(item => item.category)));

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">My Pantry</h2>
        <div className="flex gap-2">
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
            className={`px-4 py-2 rounded cursor-pointer flex items-center gap-2 ${
              loading 
                ? 'bg-gray-500 text-gray-300' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4" 
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Processing...
              </>
            ) : (
              'Upload Receipt'
            )}
          </label>
          <button
            onClick={handleClearPantry}
            className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 text-white"
            disabled={loading || pantryItems.length === 0}
          >
            Clear Pantry
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 rounded px-3 py-1.5 text-sm text-white"
        />
        <div className="flex gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(
                selectedCategory === category ? null : category
              )}
              className={`px-3 py-1 rounded text-sm ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>

      {/* Grouped Items List */}
      <div className="space-y-6">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={category} className="space-y-2">
            <h3 className="text-gray-400 text-sm font-medium">{category}</h3>
            <div className="divide-y divide-gray-700">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="py-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-white text-sm">{item.name}</span>
                    <span className="text-xs text-gray-400">
                      • {item.quantity} {item.unit}
                      {item.expiry_date && 
                        ` • Expires ${new Date(item.expiry_date).toLocaleDateString()}`
                      }
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-gray-800 rounded text-sm">
                      <button
                        onClick={() => handleQuantityChange(item, -1)}
                        className="px-2 py-0.5 text-gray-400 hover:text-white"
                      >
                        -
                      </button>
                      <span className="px-2 text-white">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, 1)}
                        className="px-2 py-0.5 text-gray-400 hover:text-white"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {Object.keys(groupedItems).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No items found.</p>
          {pantryItems.length === 0 && (
            <p className="text-sm">Upload a receipt to get started!</p>
          )}
        </div>
      )}
    </div>
  );
}
