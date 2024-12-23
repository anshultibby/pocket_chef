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
  const [editableItems, setEditableItems] = useState<PantryItemCreate[]>(items);

  const handleItemUpdate = (index: number, updates: Partial<PantryItemCreate>) => {
    setEditableItems(prev => prev.map((item, i) => 
      i === index ? { ...item, ...updates } : item
    ));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Review Receipt Items</h2>
        
        {receiptImage && (
          <img 
            src={receiptImage} 
            alt="Receipt" 
            className="mb-4 max-h-48 mx-auto"
          />
        )}

        <div className="space-y-4 mb-6">
          {editableItems.map((item, index) => (
            <div key={index} className="bg-gray-700 p-4 rounded-lg">
              <input
                value={item.data.name}
                onChange={(e) => handleItemUpdate(index, { 
                  data: { ...item.data, name: e.target.value }
                })}
                className="bg-gray-600 p-2 rounded w-full mb-2"
              />
              <div className="flex gap-4">
                <input
                  type="number"
                  value={item.data.quantity}
                  onChange={(e) => handleItemUpdate(index, {
                    data: { ...item.data, quantity: parseFloat(e.target.value) }
                  })}
                  className="bg-gray-600 p-2 rounded w-24"
                />
                <input
                  value={item.data.unit}
                  onChange={(e) => handleItemUpdate(index, {
                    data: { ...item.data, unit: e.target.value }
                  })}
                  className="bg-gray-600 p-2 rounded w-24"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end space-x-4">
          <button onClick={onCancel}>
            Cancel
          </button>
          <button onClick={() => onConfirm(editableItems)}>
            Save Items
          </button>
        </div>
      </div>
    </div>
  );
}
