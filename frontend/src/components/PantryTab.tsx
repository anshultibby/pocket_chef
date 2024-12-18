import { useState, useEffect, useRef } from 'react';
import { PantryItem, PantryItemCreate } from '@/types';
import { pantryApi } from '@/lib/api';
import ReceiptConfirmation from '@/components/ReceiptConfirmation';

interface PantryTabProps {
  pantryItems: PantryItem[];
  loading: boolean;
  onAddItems: (items: PantryItem[]) => void;
  onUpdateItem: (id: string, updates: Partial<PantryItem>) => void;
  onDeleteItem: (id: string) => void;
}

export default function PantryTab({
  pantryItems,
  loading,
  onAddItems,
  onUpdateItem,
  onDeleteItem
}: PantryTabProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddItemForm, setShowAddItemForm] = useState(false);
  const [pendingItems, setPendingItems] = useState<PantryItemCreate[]>([]);
  const [showReceiptConfirmation, setShowReceiptConfirmation] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedItem, setSelectedItem] = useState<PantryItem | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  if (loading) {
    return <div className="text-center py-8">Loading pantry...</div>;
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);

    // Create URL for receipt image preview
    const imageUrl = URL.createObjectURL(file);
    setReceiptImage(imageUrl);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const parsedItems = await pantryApi.uploadReceipt(formData);
      setPendingItems(parsedItems);
      setShowReceiptConfirmation(true);
    } catch (err) {
      let errorMessage = 'Failed to process receipt';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      // Clean up the created URL if there's an error
      URL.revokeObjectURL(imageUrl);
      setReceiptImage(null);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleItemUpdate = async (item: PantryItem, updates: Partial<PantryItem>) => {
    try {
      const updatedItem = await pantryApi.updateItem(item.id, updates);
      onUpdateItem(item.id, updatedItem);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update item';
      setError(message);
      console.error('Update item error:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    try {
      await pantryApi.deleteItem(itemId);
      onDeleteItem(itemId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete item';
      setError(message);
      console.error('Delete error:', err);
    }
  };

  const handleClearPantry = async () => {
    if (!confirm('Are you sure you want to clear all items from your pantry?')) {
      return;
    }

    try {
      await pantryApi.clearPantry();
      onAddItems([]);
      setSelectedCategory(null);
      setSearchTerm('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to clear pantry';
      setError(message);
      console.warn('Clear pantry error:', err);
    }
  };

  const handleAddItem = async (item: PantryItemCreate) => {
    try {
      // Check if item with same name and unit already exists
      const existingItem = pantryItems.find(
        existing => 
          normalizeString(existing.name) === normalizeString(item.name) &&
          normalizeString(existing.unit) === normalizeString(item.unit)
      );

      if (existingItem) {
        // Update existing item's quantity
        const updatedItem = await pantryApi.updateItem(existingItem.id, {
          quantity: existingItem.quantity + item.quantity
        });
        onUpdateItem(existingItem.id, updatedItem);
      } else {
        // Add new item
        const [addedItem] = await pantryApi.addItems([item]);
        onAddItems([addedItem]);
      }
      setShowAddItemForm(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add item';
      setError(message);
    }
  };

  const handleConfirmReceiptItems = async (confirmedItems: PantryItemCreate[]) => {
    try {
      const formattedItems = confirmedItems.map(item => ({
        name: item.name,
        quantity: Number(item.quantity),
        unit: item.unit || 'units',
        category: item.category || 'other',
        expiry_date: item.expiry_date ? new Date(item.expiry_date).toISOString() : null,
        notes: item.notes || ''
      }));

      console.log('Sending items to backend:', formattedItems);

      const savedItems = await pantryApi.addItems(formattedItems);
      onAddItems(savedItems);
      
      setShowReceiptConfirmation(false);
      setPendingItems([]);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add items';
      setError(message);
      console.error('Error saving items:', err);
    }
  };

  const handleCloseConfirmation = () => {
    if (receiptImage) {
      URL.revokeObjectURL(receiptImage);
      setReceiptImage(null);
    }
    setShowReceiptConfirmation(false);
    setPendingItems([]);
  };

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

  const categories = Array.from(new Set(pantryItems.map(item => item.category)));

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const ItemEditModal = ({ item, onClose, onUpdate }: {
    item: PantryItem;
    onClose: () => void;
    onUpdate: (updates: Partial<PantryItem>) => void;
  }) => (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-medium text-white">Edit Item</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Name</label>
            <input
              type="text"
              value={item.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Quantity</label>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => onUpdate({ quantity: parseFloat(e.target.value) })}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Unit</label>
              <input
                type="text"
                value={item.unit}
                onChange={(e) => onUpdate({ unit: e.target.value })}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Category</label>
            <input
              type="text"
              value={item.category || ''}
              onChange={(e) => onUpdate({ category: e.target.value })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Expiry Date</label>
            <input
              type="date"
              value={item.expiry_date ? new Date(item.expiry_date).toISOString().split('T')[0] : ''}
              onChange={(e) => onUpdate({ 
                expiry_date: e.target.value || undefined 
              })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-gray-400">Notes</label>
            <textarea
              value={item.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  const AddItemModal = ({ onClose, onAdd }: {
    onClose: () => void;
    onAdd: (item: PantryItemCreate) => void;
  }) => {
    const [newItem, setNewItem] = useState<PantryItemCreate>({
      name: '',
      quantity: 1,
      unit: '',
      category: '',
      expiry_date: null,
      notes: ''
    });

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4">
          <h3 className="text-lg font-medium text-white">Add New Item</h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400">Name</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-400">Quantity</label>
                <input
                  type="number"
                  value={newItem.quantity}
                  onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                  className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400">Unit</label>
                <input
                  type="text"
                  value={newItem.unit}
                  onChange={(e) => setNewItem(prev => ({ ...prev, unit: e.target.value }))}
                  className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-400">Category</label>
              <input
                type="text"
                value={newItem.category}
                onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Expiry Date</label>
              <input
                type="date"
                value={newItem.expiry_date ? new Date(newItem.expiry_date).toISOString().split('T')[0] : ''}
                onChange={(e) => setNewItem(prev => ({ 
                  ...prev, 
                  expiry_date: e.target.value || null 
                }))}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-gray-400">Notes</label>
              <textarea
                value={newItem.notes || ''}
                onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
                rows={3}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700/50 text-gray-300 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => onAdd(newItem)}
              className="px-4 py-2 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 transition-colors"
            >
              Add Item
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Helper function for consistent comparison
  const normalizeString = (str: string) => {
    return str.toLowerCase().trim();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4">
        <div className="relative w-64">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-gray-800/50 rounded-lg px-10 py-2 text-white w-full focus:ring-2 ring-blue-500 focus:outline-none text-sm"
          />
        </div>

        <button
          onClick={() => setShowAddItemForm(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors"
        >
          <span>+</span>
          Add Item
        </button>
        
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
        />
        <button
          onClick={handleUploadClick}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
            isUploading 
              ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400'
          }`}
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <span className="animate-spin">⟳</span>
              Processing...
            </>
          ) : (
            <>
              <span>📄</span>
              Upload Receipt
            </>
          )}
        </button>

        <button
          onClick={handleClearPantry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 transition-colors"
          disabled={isUploading || pantryItems.length === 0}
        >
          <span>🗑️</span>
          Clear Pantry
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {categories.map((category, index) => (
          <button
            key={`category-button-${category}-${index}`}
            onClick={() => setSelectedCategory(
              selectedCategory === category ? null : category
            )}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedCategory === category
                ? 'bg-blue-600/30 text-blue-400 ring-2 ring-blue-500/50'
                : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
              }`}
          >
            {category}
            <span className="ml-2 bg-gray-700/50 px-2 py-0.5 rounded-full text-xs">
              {pantryItems.filter(item => item.category === category).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(groupedItems).map(([category, items]) => (
          <div key={`category-${category}`} className="bg-gray-800/30 rounded-lg p-4 backdrop-blur-sm ring-1 ring-white/5">
            <h3 className="text-gray-400 text-sm font-medium mb-3">
              {category}
            </h3>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} 
                  className="bg-gray-700/30 rounded-lg p-3 flex items-center justify-between hover:ring-1 ring-white/10 transition-all cursor-pointer"
                  onClick={() => setSelectedItem(item)}
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-white text-sm font-medium">{item.name}</span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span className="bg-gray-700/50 px-2 py-1 rounded-md">
                        {item.quantity} {item.unit}
                      </span>
                      {item.expiry_date && (
                        <span className="text-yellow-500/70">
                          Expires {new Date(item.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.id);
                    }}
                    className="p-1.5 rounded-md hover:bg-red-500/10 text-red-400/70 hover:text-red-400 transition-colors"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {Object.keys(groupedItems).length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <p>No items found.</p>
          {pantryItems.length === 0 && (
            <p className="text-sm">Upload a receipt to get started!</p>
          )}
        </div>
      )}

      {showAddItemForm && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowAddItemForm(false)}
        />
      )}

      {showReceiptConfirmation && (
        <ReceiptConfirmation
          items={pendingItems}
          receiptImage={receiptImage}
          onConfirm={handleConfirmReceiptItems}
          onCancel={handleCloseConfirmation}
        />
      )}

      {selectedItem && (
        <ItemEditModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onUpdate={(updates) => {
            handleItemUpdate(selectedItem, updates);
            setSelectedItem(prev => prev ? { ...prev, ...updates } : null);
          }}
        />
      )}
    </div>
  );
}
