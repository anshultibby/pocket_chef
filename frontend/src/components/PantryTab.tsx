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
    console.log('Updating quantity:', item.id, change);
    const newQuantity = Math.max(0, item.quantity + change);
    if (newQuantity === item.quantity) return;

    try {
      // First update the item in the backend
      await pantryApi.updateItem(item.id, { quantity: newQuantity });
      // Then update the UI
      await onUpdateItem(item.id, { quantity: newQuantity });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update quantity';
      setError(message);
      console.warn('Update quantity error:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    console.log('Starting delete for item:', itemId);
    try {
      // First delete the item in the backend
      console.log('Calling backend delete...');
      await pantryApi.deleteItem(itemId);
      console.log('Backend delete successful');
      
      // Then update the UI
      console.log('Updating UI...');
      onDeleteItem(itemId);
      console.log('UI update complete');
    } catch (err) {
      console.error('Full delete error:', err);
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      setError(message);
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

      {/* Category Filters */}
      <div className="flex gap-4 items-center">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-gray-800 rounded px-3 py-2 text-sm text-white flex-grow"
        />
        <div className="flex gap-2 flex-wrap">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(
                selectedCategory === category ? null : category
              )}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
            >
              {category}
              <span className="ml-2 bg-gray-700 px-2 py-0.5 rounded-full text-xs">
                {pantryItems.filter(item => item.category === category).length}
              </span>
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
                <div key={item.id} className="py-3 flex items-center justify-between hover:bg-gray-800/50 rounded px-3 transition-colors">
                  <div className="flex flex-col gap-1">
                    <span className="text-white font-medium">{item.name}</span>
                    <div className="flex gap-2 text-xs text-gray-400">
                      <span>{item.quantity} {item.unit}</span>
                      {item.expiry_date && (
                        <>
                          <span>•</span>
                          <span>Expires {new Date(item.expiry_date).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center bg-gray-700 rounded-lg shadow-inner">
                      <button
                        onClick={() => handleQuantityChange(item, -1)}
                        className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-600 rounded-l-lg transition-colors"
                      >
                        -
                      </button>
                      <span className="px-3 text-white font-medium">{item.quantity}</span>
                      <button
                        onClick={() => handleQuantityChange(item, 1)}
                        className="px-3 py-1.5 text-gray-300 hover:text-white hover:bg-gray-600 rounded-r-lg transition-colors"
                      >
                        +
                      </button>
                    </div>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-sm text-red-400 hover:text-red-300 hover:underline"
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
