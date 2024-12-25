import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { pantryItemCreateSchema} from '@/schemas/pantry';
import { PantryItemCreate, PantryItemUpdate } from '@/types';
import { FormField } from '@/components/forms/FormField';
import { SUGGESTED_UNITS, SUGGESTED_CATEGORIES } from '@/constants';
import { AddItemModalProps } from '@/types/pantry';
import { usePantryStore } from '@/stores/pantryStore';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export default function AddItemModal({ 
  onClose, 
  isEditing = false, 
  initialValues, 
  itemId,
  onAdd 
}: AddItemModalProps) {
  const { addItem, updateItem } = usePantryStore();
  const { handleError } = useErrorHandler();
  const [showNutrition, setShowNutrition] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  const methods = useForm<PantryItemCreate>({
    resolver: zodResolver(pantryItemCreateSchema),
    defaultValues: initialValues || {
      data: {
        name: '',
        quantity: 1,
        unit: '',
        category: ''
      },
      nutrition: {}
    }
  });

  const { handleSubmit, formState: { isSubmitting } } = methods;

  const onSubmit = async (values: PantryItemCreate) => {
    try {
      if (onAdd) {
        onAdd(values);
        onClose();
        return;
      }

      if (isEditing && itemId) {
        const updates: PantryItemUpdate = {
          data: values.data,
          nutrition: values.nutrition
        };
        await updateItem(itemId, updates);
      } else {
        await addItem(values);
      }
      onClose();
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">
          {isEditing ? 'Edit Item' : 'Add New Item'}
        </h2>
        
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="data.name"
                label="Name"
                required
                placeholder="Common name (e.g., bread)"
              />
              
              <FormField
                name="data.original_name"
                label="Original Name"
                placeholder="As scanned/entered (optional)"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="data.quantity"
                label="Quantity"
                type="number"
                min="0"
                step="0.1"
                required
              />
              
              <FormField
                name="data.unit"
                label="Unit"
                required
                placeholder="Enter or select a unit"
                className="datalist-input"
                list="unit-suggestions"
              />
              <datalist id="unit-suggestions">
                {SUGGESTED_UNITS.map(unit => (
                  <option key={unit} value={unit} />
                ))}
              </datalist>
            </div>

            <FormField
              name="data.category"
              label="Category"
              placeholder="Select or enter category"
              list="category-suggestions"
            />
            <datalist id="category-suggestions">
              {SUGGESTED_CATEGORIES.map(cat => (
                <option key={cat} value={cat} />
              ))}
            </datalist>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                name="data.price"
                label="Price"
                type="number"
                min="0"
                step="0.01"
                placeholder="Enter price (optional)"
              />

              <FormField
                name="data.expiry_date"
                label="Expiry Date"
                type="date"
              />
            </div>

            {/* Nutrition Section */}
            <div className="border-t border-gray-700 pt-4">
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
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      name="nutrition.calories"
                      label="Calories"
                      type="number"
                      min="0"
                      step="1"
                    />
                    <FormField
                      name="nutrition.protein"
                      label="Protein"
                      type="number"
                      min="0"
                      step="0.1"
                    />
                    <FormField
                      name="nutrition.carbs"
                      label="Carbs"
                      type="number"
                      min="0"
                      step="0.1"
                    />
                    <FormField
                      name="nutrition.fat"
                      label="Fat"
                      type="number"
                      min="0"
                      step="0.1"
                    />
                    <FormField
                      name="nutrition.fiber"
                      label="Fiber"
                      type="number"
                      min="0"
                      step="0.1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notes Section */}
            <div className="border-t border-gray-700 pt-4">
              <button
                type="button"
                onClick={() => setShowNotes(!showNotes)}
                className="text-blue-400 hover:text-blue-300 mb-3"
              >
                {showNotes ? 'Hide Notes' : 'Notes'}
              </button>

              {showNotes && (
                <FormField
                  name="data.notes"
                  label="Notes"
                  placeholder="Add any notes about this item..."
                />
              )}
            </div>

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
        </FormProvider>
      </div>
    </div>
  );
}
  