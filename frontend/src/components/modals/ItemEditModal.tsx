import { ItemEditModalProps } from '@/types/pantry';

export default function ItemEditModal({ item, onClose, onUpdate }: ItemEditModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Edit Item</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Name</label>
            <input
              type="text"
              value={item.data.name}
              onChange={(e) => onUpdate({
                data: { ...item.data, name: e.target.value }
              })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Quantity</label>
              <input
                type="number"
                value={item.data.quantity}
                onChange={(e) => onUpdate({
                  data: { ...item.data, quantity: Number(e.target.value) }
                })}
                min="0.1"
                step="0.1"
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>
            
            <div>
              <label className="text-sm text-gray-400">Unit</label>
              <input
                type="text"
                value={item.data.unit}
                onChange={(e) => onUpdate({
                  data: { ...item.data, unit: e.target.value }
                })}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-400">Category</label>
            <input
              type="text"
              value={item.data.category || ''}
              onChange={(e) => onUpdate({
                data: { ...item.data, category: e.target.value }
              })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="text-sm text-gray-400 space-y-1">
            <p>Nutrition (per serving):</p>
            <ul className="pl-4 text-xs">
              <li>Calories: {item.nutrition.calories}</li>
              <li>Protein: {item.nutrition.protein}g</li>
              <li>Carbs: {item.nutrition.carbs}g</li>
              <li>Fat: {item.nutrition.fat}g</li>
              <li>Fiber: {item.nutrition.fiber}g</li>
            </ul>
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
}