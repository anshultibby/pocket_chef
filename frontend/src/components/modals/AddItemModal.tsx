import { FormInput } from '../shared/FormInput';
import { FormSelect } from '../shared/FormSelect';
import { AddItemModalProps } from '@/types/pantry';
import { useItemForm } from '@/hooks/useItemForm';
import { PantryItemCreate } from '@/types';

const UNIT_OPTIONS = [
  { value: 'units', label: 'Units' },
  { value: 'grams', label: 'Grams' },
  { value: 'milliliters', label: 'Milliliters' },
  { value: 'pinch', label: 'Pinch' },
];

export default function AddItemModal({ onAdd, onClose }: AddItemModalProps) {
  const { values, handleChange, handleSubmit, isSubmitting, errors } = useItemForm({
    onSubmit: (formValues) => {
      const item: PantryItemCreate = {
        data: {
          display_name: formValues.display_name,
          quantity: formValues.quantity,
          unit: formValues.unit,
          notes: formValues.notes || '',
          expiry_date: formValues.expiry_date || undefined,
        }
      };
      return onAdd(item);
    },
    onClose,
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Add Item</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <FormInput
            label="Name"
            value={values.display_name || ''}
            onChange={(e) => handleChange('display_name', e.target.value)}
            error={errors.display_name}
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <FormInput
              label="Quantity"
              type="number"
              value={values.quantity || ''}
              onChange={(e) => handleChange('quantity', Number(e.target.value))}
              error={errors.quantity}
              min="0"
              step="0.1"
              required
            />
            
            <FormSelect
              label="Unit"
              value={values.unit}
              onChange={(e) => handleChange('unit', e.target.value)}
              options={UNIT_OPTIONS}
              error={errors.unit}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
            <textarea
              value={values.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:ring-2 ring-blue-500 focus:outline-none"
              rows={3}
            />
            {errors.notes && (
              <span className="text-red-400 text-sm mt-1">{errors.notes}</span>
            )}
          </div>

          {errors.form && (
            <div className="text-red-400 text-sm">{errors.form}</div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded-lg disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
  