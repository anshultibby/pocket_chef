import { useState } from 'react';

interface AddItemFormProps {
  onSubmit: (item: PantryItemCreate) => void;
  onCancel: () => void;
}

export default function AddItemForm({ onSubmit, onCancel }: AddItemFormProps) {
  const [item, setItem] = useState<PantryItemCreate>({
    name: '',
    quantity: 1,
    unit: 'units',
    category: 'Other',
    expiry_date: null
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <h3 className="text-lg font-semibold text-white mb-4">Add New Item</h3>
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(item);
        }}>
          {/* Add form fields for name, quantity, unit, category, expiry_date */}
          <div className="space-y-4">
            {/* Add your form inputs here */}
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded bg-gray-700 text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded bg-blue-600 text-white"
            >
              Add Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
