import React, { useState } from 'react';

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
        unit: 'units',
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
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg 
                    transform transition-transform duration-300 ease-in-out">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-300">Review Receipt Items</h3>
          <div className="flex gap-2">
            <button
              onClick={onCancel}
              className="text-sm px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="text-sm px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Adding...' : `Add ${editedItems.length} Items`}
            </button>
          </div>
        </div>

        <div className="flex gap-4 h-[400px]">
          {/* Receipt Image Panel */}
          <div className="w-1/3 bg-gray-900 rounded-lg overflow-hidden">
            {receiptImage ? (
              <div className="h-full overflow-auto">
                <img 
                  src={receiptImage} 
                  alt="Receipt" 
                  className="w-full object-contain"
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                No receipt image available
              </div>
            )}
          </div>

          {/* Items Panel */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex justify-end mb-2">
              <button
                onClick={addNewItem}
                className="text-sm px-3 py-1 rounded bg-green-600 text-white hover:bg-green-700"
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
      </div>
    </div>
  );
}
