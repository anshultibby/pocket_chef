import { FormInput } from '../shared/FormInput';
import { AddItemModalProps } from '@/types/pantry';
import { useItemForm } from '@/hooks/useItemForm';
import { PantryItemCreate } from '@/types';
import { useState } from 'react';

const SUGGESTED_UNITS = [
  'grams',
  'milliliters',
  'units',
  'pieces',
  'cups',
  'tablespoons',
  'teaspoons',
  'ounces',
  'pounds',
  'pinch'
];

const SUGGESTED_CATEGORIES = [
  'Produce',
  'Meat & Seafood',
  'Dairy & Eggs',
  'Pantry Staples',
  'Snacks',
  'Beverages',
  'Frozen Foods',
  'Condiments',
  'Baking',
  'Other'
];

const SUGGESTED_STANDARD_UNITS = [
  '100 g',
  '100 ml',
  '1 serving',
  '1 piece',
  '1 cup',
  '1 oz'
];

interface AddItemModalProps {
  initialValues?: PantryItemCreate;
  onAdd: (item: PantryItemCreate) => void;
  onClose: () => void;
  isEditing?: boolean;
}

export default function AddItemModal({ 
  initialValues, 
  onAdd, 
  onClose,
  isEditing = false 
}: AddItemModalProps) {
  const { values, handleChange, handleSubmit, isSubmitting, errors } = useItemForm({ 
    initialValues,
    onSubmit: onAdd, 
    onClose 
  });
  const [showNutrition, setShowNutrition] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Name"
              value={values.data.name}
              onChange={(e) => handleChange('name', e.target.value)}
              error={errors['name']}
              required
              placeholder="As it appears on packaging"
            />

            <FormInput
              label="Standard Name"
              value={values.data.standard_name || ''}
              onChange={(e) => handleChange('standard_name', e.target.value)}
              error={errors['standard_name']}
              placeholder="Common/generic name (optional)"
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <FormInput
              label="Quantity"
              type="number"
              value={values.data.quantity}
              onChange={(e) => handleChange('quantity', Number(e.target.value))}
              error={errors['quantity']}
              min="0"
              step="0.1"
            />
            
            <div>
              <label className="text-sm text-gray-400">Unit</label>
              <input
                list="unit-suggestions"
                type="text"
                value={values.data.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
                placeholder="Enter or select a unit"
                required
              />
              <datalist id="unit-suggestions">
                {SUGGESTED_UNITS.map(unit => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="mt-4">
            <div>
              <label className="text-sm text-gray-400">Category</label>
              <input
                list="category-suggestions"
                type="text"
                value={values.data.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
                placeholder="Select or enter category"
              />
              <datalist id="category-suggestions">
                {SUGGESTED_CATEGORIES.map(cat => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label="Price"
              type="number"
              value={values.data.price?.toString() ?? ''}
              onChange={(e) => handleChange('price', e.target.value ? Number(e.target.value) : undefined)}
              min="0"
              step="0.01"
              placeholder="Enter price (optional)"
              className="w-full"
            />

            <div>
              <label className="text-sm text-gray-400">Expiry Date</label>
              <input
                type="date"
                value={values.data.expiry_date ? new Date(values.data.expiry_date).toISOString().split('T')[0] : ''}
                onChange={(e) => handleChange('expiry_date', e.target.value || null)}
                className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-t border-gray-700 pt-4 mt-4">
            <button
              type="button"
              onClick={() => setShowNutrition(!showNutrition)}
              className="text-blue-400 hover:text-blue-300 mb-3"
            >
              {showNutrition ? 'Hide Nutrition' : 'Nutrition'}
            </button>

            {showNutrition && (
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-400">
                    Note: Nutrition information will be automatically enriched if left empty
                  </p>
                  <p className="text-sm text-gray-400">
                    All values below are per {values.nutrition.standard_unit || '100 grams'}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormInput
                    label="Calories"
                    type="number"
                    value={values.nutrition.calories ?? ''}
                    onChange={(e) => handleChange('calories', e.target.value ? Number(e.target.value) : undefined, 'nutrition')}
                    min="0"
                    step="1"
                  />
                  <FormInput
                    label="Protein"
                    type="number"
                    value={values.nutrition.protein ?? ''}
                    onChange={(e) => handleChange('protein', e.target.value ? Number(e.target.value) : undefined, 'nutrition')}
                    min="0"
                    step="0.1"
                  />
                  <FormInput
                    label="Carbs"
                    type="number"
                    value={values.nutrition.carbs ?? ''}
                    onChange={(e) => handleChange('carbs', e.target.value ? Number(e.target.value) : undefined, 'nutrition')}
                    min="0"
                    step="0.1"
                  />
                  <FormInput
                    label="Fat"
                    type="number"
                    value={values.nutrition.fat ?? ''}
                    onChange={(e) => handleChange('fat', e.target.value ? Number(e.target.value) : undefined, 'nutrition')}
                    min="0"
                    step="0.1"
                  />
                  <FormInput
                    label="Fiber"
                    type="number"
                    value={values.nutrition.fiber ?? ''}
                    onChange={(e) => handleChange('fiber', e.target.value ? Number(e.target.value) : undefined, 'nutrition')}
                    min="0"
                    step="0.1"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-700 pt-4 mt-4">
            <button
              type="button"
              onClick={() => setShowNotes(!showNotes)}
              className="text-blue-400 hover:text-blue-300 mb-3"
            >
              {showNotes ? 'Hide Notes' : 'Notes'}
            </button>

            {showNotes && (
              <div>
                <textarea
                  value={values.data.notes}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  className="w-full bg-gray-700 rounded-lg px-3 py-2 focus:ring-2 ring-blue-500 focus:outline-none"
                  rows={3}
                  placeholder="Add any notes about this item..."
                />
                {errors['notes'] && (
                  <span className="text-red-400 text-sm mt-1">{errors['notes']}</span>
                )}
              </div>
            )}
          </div>

          {errors.form && (
            <div className="text-red-400 text-sm mt-4">{errors.form}</div>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Item')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
  