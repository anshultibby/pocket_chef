import { RecipeReviewStepProps } from './types';
import { IngredientList } from './IngredientList';
export function RecipeReviewStep({
  recipe,
  pantryItems,
  servings,
  onServingsChange,
  onContinue,
  onClose
}: RecipeReviewStepProps) {
  const scaledIngredients = recipe.data.ingredients.map(ing => ({
    ...ing,
    quantity: (ing.quantity / recipe.data.servings) * servings
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-gray-300">Servings:</label>
        <input 
          type="number"
          min="1"
          value={servings}
          onChange={(e) => onServingsChange(Math.max(1, parseInt(e.target.value) || 1))}
          className="bg-gray-800 rounded px-3 py-2 text-white"
        />
      </div>

      <IngredientList 
        ingredients={scaledIngredients}
        pantryItems={pantryItems}
      />

      <div className="flex justify-end gap-4">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Cancel
        </button>
        <button
          onClick={onContinue}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
