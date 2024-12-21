import { MEASUREMENT_UNITS, MeasurementUnit } from '@/types';
import { ItemEditModalProps } from '@/types/pantry';

export default function ItemEditModal({ item, onClose, onUpdate }: ItemEditModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md space-y-4">
        <h3 className="text-lg font-medium text-white">Edit Item</h3>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-400">Display Name</label>
            <input
              type="text"
              value={item.data.display_name}
              onChange={(e) => onUpdate({ 
                data: { ...item.data, display_name: e.target.value }
              })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
            />
          </div>
  
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-400">Quantity</label>
              <input
                type="number"
                step="0.1"
                value={item.data.quantity}
                onChange={(e) => onUpdate({ 
                  data: { ...item.data, quantity: parseFloat(e.target.value) }
                })}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-gray-400">Unit</label>
              <select
                value={item.data.unit}
                onChange={(e) => onUpdate({ 
                  data: { ...item.data, unit: e.target.value as MeasurementUnit }
                })}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              >
                {MEASUREMENT_UNITS.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>
  
          <div>
            <label className="text-sm text-gray-400">Expiry Date</label>
            <input
              type="date"
              value={item.data.expiry_date ? new Date(item.data.expiry_date).toISOString().split('T')[0] : ''}
              onChange={(e) => onUpdate({ 
                data: { ...item.data, expiry_date: e.target.value || undefined }
              })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
            />
          </div>
  
          <div>
            <label className="text-sm text-gray-400">Notes</label>
            <textarea
              value={item.data.notes || ''}
              onChange={(e) => onUpdate({ 
                data: { ...item.data, notes: e.target.value }
              })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              rows={3}
            />
          </div>
  
          <div>
            <label className="text-sm text-gray-400">Category</label>
            <input
              type="text"
              value={item.data.category || ''}
              onChange={(e) => onUpdate({ 
                data: { ...item.data, category: e.target.value || undefined }
              })}
              className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
            />
          </div>
  
          <div className="text-sm text-gray-400 space-y-1">
            <p>Ingredient: {item.ingredient.names.canonical}</p>
            <p>Standard Unit: {item.ingredient.measurement.standard_unit}</p>
            <p>Nutrition (per {item.ingredient.measurement.serving_size} {item.ingredient.measurement.standard_unit}):</p>
            <ul className="pl-4 text-xs">
              <li>Calories: {item.ingredient.nutrition.per_standard_unit.calories}</li>
              <li>Protein: {item.ingredient.nutrition.per_standard_unit.protein}g</li>
              <li>Carbs: {item.ingredient.nutrition.per_standard_unit.carbs}g</li>
              <li>Fat: {item.ingredient.nutrition.per_standard_unit.fat}g</li>
              <li>Fiber: {item.ingredient.nutrition.per_standard_unit.fiber}g</li>
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