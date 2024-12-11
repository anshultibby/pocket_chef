import React, { useState } from 'react';
import Image from 'next/image';
import { PantryItemCreate } from '@/types';

interface ReceiptConfirmationProps {
  items: PantryItemCreate[];
  receiptImage: string | null;
  onConfirm: (items: PantryItemCreate[]) => void;
  onCancel: () => void;
}

export default function ReceiptConfirmation({ 
  items, 
  receiptImage, 
  onConfirm, 
  onCancel 
}: ReceiptConfirmationProps) {
  const [editedItems, setEditedItems] = useState<(PantryItemCreate & { tempId: number; isEditing?: boolean })[]>(
    items.map((item, index) => ({ ...item, tempId: index, isEditing: false }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addNewItem = () => {
    setEditedItems([
      {
        tempId: editedItems.length,
        name: '',
        quantity: 1,
        category: '',
        unit: '',
        expiry_date: null,
        notes: '',
        isEditing: true,
      },
      ...editedItems,
    ]);
  };

  const toggleEdit = (tempId: number) => {
    setEditedItems(items =>
      items.map(item =>
        item.tempId === tempId
          ? { ...item, isEditing: !item.isEditing }
          : item
      )
    );
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const validItems = editedItems
        .filter(item => item.name.trim() && item.category.trim())
        .map(({ tempId, isEditing, ...item }) => ({
          ...item,
          name: item.name.trim(),
          category: item.category.trim(),
          quantity: Math.max(1, Math.floor(item.quantity)),
          unit: item.unit || 'units'
        }));
        
      await onConfirm(validItems);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex gap-6">
          {/* Receipt Image Preview */}
          {receiptImage && (
            <div className="w-1/2">
              <h3 className="text-lg font-semibold mb-4">Receipt Image</h3>
              <div className="relative aspect-[3/4] bg-gray-900 rounded-lg overflow-hidden">
                <img 
                  src={receiptImage} 
                  alt="Receipt"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>
            </div>
          )}
          
          {/* Items List */}
          <div className={receiptImage ? 'w-1/2' : 'w-full'}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Confirm Items</h3>
              <button
                onClick={addNewItem}
                className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg text-sm"
              >
                Add Item
              </button>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {editedItems.map(item => (
                  <div 
                    key={item.tempId} 
                    className="flex flex-col bg-gray-700 rounded p-2 gap-2"
                  >
                    <div className="flex justify-between">
                      {item.isEditing ? (
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const newItems = [...editedItems];
                            const itemIndex = newItems.findIndex(i => i.tempId === item.tempId);
                            newItems[itemIndex] = {
                              ...item,
                              name: e.target.value
                            };
                            setEditedItems(newItems);
                          }}
                          className="flex-grow text-sm text-white bg-gray-600 rounded p-1"
                          placeholder="Item name"
                        />
                      ) : (
                        <span className="flex-grow text-sm text-white p-1">{item.name}</span>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => toggleEdit(item.tempId)}
                          className="text-gray-400 hover:text-white"
                        >
                          {item.isEditing ? "✓" : "✎"}
                        </button>
                        <button
                          onClick={() => {
                            setEditedItems(editedItems.filter(i => i.tempId !== item.tempId));
                          }}
                          className="text-red-400 hover:text-red-300"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {item.isEditing ? (
                        <>
                          <input
                            type="text"
                            value={item.category}
                            onChange={(e) => {
                              const newItems = [...editedItems];
                              const itemIndex = newItems.findIndex(i => i.tempId === item.tempId);
                              newItems[itemIndex] = {
                                ...item,
                                category: e.target.value
                              };
                              setEditedItems(newItems);
                            }}
                            className="flex-grow text-sm text-white bg-gray-600 rounded p-1"
                            placeholder="Category"
                          />
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => {
                              const newItems = [...editedItems];
                              const itemIndex = newItems.findIndex(i => i.tempId === item.tempId);
                              newItems[itemIndex] = {
                                ...item,
                                quantity: Number(e.target.value)
                              };
                              setEditedItems(newItems);
                            }}
                            className="w-16 text-sm text-center text-white bg-gray-600 rounded p-1"
                            min="1"
                          />
                        </>
                      ) : (
                        <>
                          <span className="flex-grow text-sm text-white p-1">{item.category}</span>
                          <span className="w-16 text-sm text-center text-white p-1">{item.quantity}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
          >
            {isSubmitting ? 'Saving...' : 'Save Items'}
          </button>
        </div>
      </div>
    </div>
  );
}
