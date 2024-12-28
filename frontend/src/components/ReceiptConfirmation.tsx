'use client';

import React, { useState } from 'react';
import { PantryItemCreate } from '@/types';
import AddItemModal from './modals/AddItemModal';
import Image from 'next/image';

interface ReceiptConfirmationProps {
  items: PantryItemCreate[];
  receiptImage: string | null;
  onConfirm: (items: PantryItemCreate[]) => Promise<void>;
  onCancel: () => void;
}

export default function ReceiptConfirmation({ 
  items, 
  receiptImage, 
  onCancel,
  onConfirm
}: ReceiptConfirmationProps) {
  const [editableItems, setEditableItems] = useState<PantryItemCreate[]>(items);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleItemUpdate = (index: number, updatedItem: PantryItemCreate) => {
    setEditableItems(prev => prev.map((item, i) => 
      i === index ? updatedItem : item
    ));
    setSelectedItemIndex(null);
  };

  const handleAddItem = (newItem: PantryItemCreate) => {
    setEditableItems(prev => [...prev, newItem]);
    setShowAddModal(false);
  };

  const handleDeleteItem = (index: number) => {
    setEditableItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(editableItems);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-7xl h-[90vh] flex overflow-hidden">
        {/* Left side - Receipt Image */}
        <div className="w-1/2 border-r border-gray-700 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-4">Receipt Image</h2>
          <div className="relative flex-1 bg-gray-900 rounded-lg overflow-hidden">
            {receiptImage && (
              <Image 
                src={receiptImage}
                alt="Receipt"
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            )}
          </div>
        </div>

        {/* Right side - Items List */}
        <div className="w-1/2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Detected Items</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 rounded-lg bg-green-600/20 hover:bg-green-600/30 text-green-400 transition-colors flex items-center gap-2"
            >
              <span>+</span>
              Add Item
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {editableItems.map((item, index) => (
              <div 
                key={index} 
                className="bg-gray-700 p-4 rounded-lg hover:bg-gray-600 transition-colors group"
              >
                <div className="flex justify-between items-start">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => setSelectedItemIndex(index)}
                  >
                    <div className="font-medium">{item.data.name}</div>
                    <div className="text-sm text-gray-300">
                      {item.data.quantity} {item.data.unit}
                    </div>
                    {item.data.category && (
                      <div className="text-sm text-gray-400">
                        Category: {item.data.category}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteItem(index)}
                    className="text-red-400 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Delete item"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onCancel}
              disabled={isSubmitting}
              className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isSubmitting || editableItems.length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-500 disabled:opacity-50 disabled:hover:bg-green-600 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Submitting...</span>
                </>
              ) : (
                'Confirm Items'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Only keep the edit/add modals here */}
      {selectedItemIndex !== null && (
        <AddItemModal
          initialValues={editableItems[selectedItemIndex]}
          onAdd={(updatedItem) => handleItemUpdate(selectedItemIndex, updatedItem)}
          onClose={() => setSelectedItemIndex(null)}
          isEditing={true}
        />
      )}

      {showAddModal && (
        <AddItemModal
          onAdd={handleAddItem}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
