import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { PantryItemCreate } from '@/types';

interface BulkEntryModalProps {
  onAdd: (items: PantryItemCreate[]) => Promise<void>;
  onClose: () => void;
}

interface ItemRow {
  name: string;
}

function BulkEntryModal({ onAdd, onClose }: BulkEntryModalProps) {
  const [rows, setRows] = useState<ItemRow[]>(Array(6).fill({ name: '' }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (index: number, value: string) => {
    const newRows = [...rows];
    newRows[index] = { name: value };
    setRows(newRows);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const parsedItems: PantryItemCreate[] = rows
        .filter(row => row.name.trim())
        .map(row => ({
          data: {
            name: row.name.trim(),
            quantity: 1,
            unit: 'units',
            category: 'Pantry Staples',
            expiry_date: null,
            price: null,
            original_name: row.name.trim(),
            notes: ''
          },
          nutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            standard_unit: '100 grams'
          }
        }));
      
      if (parsedItems.length === 0) return;
      await onAdd(parsedItems);
      onClose();
    } catch (error) {
      console.error('Failed to add items:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-xl rounded-xl bg-gray-800 p-6">
          <Dialog.Title className="text-xl font-semibold text-white mb-4">
            Bulk Add Items
          </Dialog.Title>

          <div className="space-y-4">
            <div className="px-3 text-sm text-gray-400">
              Enter item names (one per line)
            </div>

            <div className="bg-gray-700 rounded-lg p-3">
              <div className="space-y-2">
                {rows.map((row, index) => (
                  <div key={index}>
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => handleChange(index, e.target.value)}
                      placeholder={index === 0 ? "Apples" : ""}
                      className="w-full bg-gray-800 rounded px-3 py-2 text-white placeholder-gray-500 focus:ring-2 ring-blue-500 focus:outline-none"
                      disabled={isSubmitting}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !rows.some(row => row.name.trim())}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 disabled:opacity-50 disabled:hover:bg-blue-500"
            >
              {isSubmitting ? 'Adding...' : 'Add Items'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}

export default BulkEntryModal;
