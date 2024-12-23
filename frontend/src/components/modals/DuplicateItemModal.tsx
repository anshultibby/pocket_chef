import { PantryItem, PantryItemCreate } from '@/types';

interface DuplicateItemModalProps {
  existingItem: PantryItem;
  newItem: PantryItemCreate;
  onEditExisting: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
}

export function DuplicateItemModal({
  existingItem,
  newItem,
  onEditExisting,
  onCreateNew,
  onCancel
}: DuplicateItemModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full space-y-4">
        <h2 className="text-xl font-semibold text-yellow-400">Similar Item Found</h2>
        
        <div className="bg-gray-700/50 p-4 rounded-lg">
          <h3 className="font-medium mb-2">Existing Item:</h3>
          <p>{existingItem.data.name}</p>
          <p className="text-sm text-gray-400">
            {existingItem.data.quantity} {existingItem.data.unit}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={onEditExisting}
            className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-400 rounded-lg"
          >
            Edit Existing Item
          </button>
          <button
            onClick={onCreateNew}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            Create New Item
          </button>
          <button
            onClick={onCancel}
            className="w-full px-4 py-2 text-gray-400 hover:text-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DuplicateItemModal;
