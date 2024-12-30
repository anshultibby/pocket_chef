import { FormInput } from '../shared/FormInput';
import { AddItemModalProps } from '@/types/pantry';
import { useItemForm } from '@/hooks/useItemForm';
import { PantryItemCreate } from '@/types';
import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { motion } from 'framer-motion';

const SUGGESTED_UNITS = [
  'units',
  'grams',
  'milliliters',
  'pieces',
  'cups',
  'tablespoons',
  'teaspoons',
  'ounces',
  'pounds',
  'pinch'
];

export default function AddItemModal({ 
  initialValues, 
  onAdd, 
  onClose,
  isEditing,
  isRecipeUse,
  originalQuantity
}: AddItemModalProps) {
  const handleSubmit = async (values: PantryItemCreate) => {
    // Set default category if not provided
    if (!values.data.category) {
      values.data.category = 'Pantry Staples';
    }
    // Set default unit if not provided
    if (!values.data.unit) {
      values.data.unit = 'units';
    }
    await Promise.resolve(onAdd(values));
  };

  const { 
    values, 
    handleChange, 
    handleSubmit: submitForm, 
    isSubmitting, 
    errors 
  } = useItemForm({ 
    initialValues,
    onSubmit: handleSubmit,
    onClose 
  });

  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showNutrition, setShowNutrition] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <Dialog.Panel className="w-full max-w-xl rounded-xl bg-gray-900 p-6">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Dialog.Title className="text-2xl font-bold text-white mb-4">
                  {isEditing ? 'Edit Item' : 'Add Item'}
                </Dialog.Title>

                {isRecipeUse && (
                  <div className="mb-6 p-4 bg-blue-500/20 rounded-lg text-blue-300 text-sm">
                    <p>You are editing this item during recipe use. The quantity you set will be the final amount remaining in your pantry after using the recipe.</p>
                    {originalQuantity !== undefined && (
                      <p className="mt-2">
                        Original quantity: {originalQuantity} {values.data.unit}
                      </p>
                    )}
                  </div>
                )}
              </motion.div>

              <form onSubmit={submitForm}>
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="space-y-4">
                    <FormInput
                      label="Name"
                      value={values.data.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      error={errors['name']}
                      required
                      placeholder="Common name (e.g., bread)"
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormInput
                        label={isRecipeUse ? "Final Pantry Quantity" : "Quantity"}
                        type="number"
                        value={isSubmitting ? '' : (values.data.quantity ?? '')}
                        onChange={(e) => {
                          const value = e.target.value;
                          handleChange('quantity', value === '' ? null : Number(value));
                        }}
                        disabled={isSubmitting}
                        error={errors['quantity']}
                        placeholder="Enter quantity"
                        className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-1 ring-blue-500 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      
                      <div>
                        <label className="text-sm text-gray-400">Unit</label>
                        <input
                          type="text"
                          value={values.data.unit}
                          onChange={(e) => handleChange('unit', e.target.value)}
                          className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-1 ring-blue-500 focus:outline-none"
                          placeholder="units"
                          onFocus={() => handleChange('unit', '')}
                          list="unit-suggestions"
                          autoComplete="off"
                        />
                        <datalist id="unit-suggestions">
                          {SUGGESTED_UNITS.map(unit => (
                            <option key={unit} value={unit} />
                          ))}
                        </datalist>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="border-t border-gray-700 pt-4 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAdditionalInfo(!showAdditionalInfo)}
                      className="text-blue-400 hover:text-blue-300 mb-3"
                    >
                      {showAdditionalInfo ? 'Hide Additional Info' : 'Additional Info'}
                    </button>

                    {showAdditionalInfo && (
                      <div className="space-y-4">
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
                        </div>

                        <div>
                          <label className="text-sm text-gray-400">Expiry Date</label>
                          <input
                            type="date"
                            value={values.data.expiry_date ? new Date(values.data.expiry_date).toISOString().split('T')[0] : ''}
                            onChange={(e) => handleChange('expiry_date', e.target.value || null)}
                            className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white focus:ring-2 ring-blue-500 focus:outline-none"
                          />
                        </div>

                        <FormInput
                          label="Price"
                          error={errors.price}
                          type="number"
                          value={values.data.price?.toString() ?? ''}
                          onChange={(e) => handleChange('price', e.target.value ? Number(e.target.value) : null)}
                          min="0"
                          step="0.01"
                          placeholder="Enter price (optional)"
                        />

                        <FormInput
                          label="Original Name"
                          value={values.data.original_name || ''}
                          onChange={(e) => handleChange('original_name', e.target.value)}
                          error={errors['original_name']}
                          placeholder="As scanned/entered (optional)"
                        />
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
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
                            All values below are per {values?.nutrition?.standard_unit || '100 grams'}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <FormInput
                            label="Calories"
                            type="number"
                            value={values.nutrition.calories ?? ''}
                            onChange={(e) => handleChange('calories', e.target.value ? Number(e.target.value) : 0, 'nutrition')}
                            min="0"
                            step="1"
                          />
                          <FormInput
                            label="Protein"
                            type="number"
                            value={values.nutrition.protein ?? ''}
                            onChange={(e) => handleChange('protein', e.target.value ? Number(e.target.value) : 0, 'nutrition')}
                            min="0"
                            step="0.1"
                          />
                          <FormInput
                            label="Carbs"
                            type="number"
                            value={values.nutrition.carbs ?? ''}
                            onChange={(e) => handleChange('carbs', e.target.value ? Number(e.target.value) : 0, 'nutrition')}
                            min="0"
                            step="0.1"
                          />
                          <FormInput
                            label="Fat"
                            type="number"
                            value={values.nutrition.fat ?? ''}
                            onChange={(e) => handleChange('fat', e.target.value ? Number(e.target.value) : 0, 'nutrition')}
                            min="0"
                            step="0.1"
                          />
                          <FormInput
                            label="Fiber"
                            type="number"
                            value={values.nutrition.fiber ?? ''}
                            onChange={(e) => handleChange('fiber', e.target.value ? Number(e.target.value) : 0, 'nutrition')}
                            min="0"
                            step="0.1"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
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
                          value={values.data.notes || ''}
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
                </motion.div>

                {errors.form && (
                  <div className="text-red-400 text-sm mt-4">{errors.form}</div>
                )}

                <motion.div 
                  className="flex justify-end gap-3 mt-6"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-400 disabled:opacity-50"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Add Item')}
                  </motion.button>
                </motion.div>
              </form>
            </Dialog.Panel>
          </motion.div>
        </div>
      </div>
    </Dialog>
  );
}
  