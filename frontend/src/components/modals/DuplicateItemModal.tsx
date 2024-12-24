import { PantryItem, PantryItemCreate } from '@/types';

interface DuplicateItemModalProps {
  existingItem: PantryItem;
  newItem: PantryItemCreate;
  onMergeQuantities: () => void;
  onMergeAndEdit: () => void;
  onCreateNew: () => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

export function DuplicateItemModal({
  existingItem,
  newItem,
  onMergeQuantities,
  onMergeAndEdit,
  onCreateNew,
  onCancel,
  isProcessing = false
}: DuplicateItemModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-xl w-full space-y-4">
        <h2 className="text-xl font-semibold text-yellow-400">Similar Item Found</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <h3 className="font-medium mb-2 text-gray-300">Existing Item:</h3>
            <p className="text-lg">{existingItem.data.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              Quantity: {existingItem.data.quantity} {existingItem.data.unit}
            </p>
          </div>

          <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600">
            <h3 className="font-medium mb-2 text-gray-300">New Item:</h3>
            <p className="text-lg">{newItem.data.name}</p>
            <p className="text-sm text-gray-400 mt-1">
              Quantity: {newItem.data.quantity} {newItem.data.unit}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-6">
          <button
            onClick={onMergeQuantities}
            disabled={isProcessing}
            className={`w-full px-4 py-3 bg-blue-500 hover:bg-blue-400 rounded-lg flex items-center justify-center gap-2
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isProcessing ? 'Processing...' : (
              <>
                <span className="text-lg">+</span>
                <div>
                  <div>Merge Quantities</div>
                  <div className="text-sm text-blue-200">
                    Combined: {existingItem.data.quantity + newItem.data.quantity} {existingItem.data.unit}
                  </div>
                </div>
              </>
            )}
          </button>

          <button
            onClick={onMergeAndEdit}
            disabled={isProcessing}
            className={`w-full px-4 py-3 bg-purple-500 hover:bg-purple-400 rounded-lg flex items-center justify-center gap-2
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span>✏️</span>
            <div>
              <div>Merge and Edit Details</div>
              <div className="text-sm text-purple-200">Combine and modify item properties</div>
            </div>
          </button>

          <button
            onClick={onCreateNew}
            disabled={isProcessing}
            className={`w-full px-4 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Create as Separate Item
          </button>

          <button
            onClick={onCancel}
            disabled={isProcessing}
            className={`w-full px-4 py-2 text-gray-400 hover:text-gray-300 hover:bg-gray-800/50 rounded-lg
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default DuplicateItemModal;
