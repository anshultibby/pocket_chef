import { Recipe } from '@/types';
import { Dialog } from '@headlessui/react';
import { useRecipeStore } from '@/stores/recipeStore';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onUse: () => void;
  onRemove: () => void;
}

export default function RecipeDetailModal({ recipe, onClose, onUse }: RecipeDetailModalProps) {
  const { setRecipes } = useRecipeStore();

  const handleRemove = () => {
    setRecipes([]); // Clear recipes
    onClose();
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-gray-900 p-6 shadow-xl">
            <div className="flex justify-between items-start mb-6">
              <Dialog.Title className="text-2xl font-bold text-white">
                {recipe.data.name}
              </Dialog.Title>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Recipe Info */}
              <div className="flex gap-4 text-sm">
                <span className="px-3 py-1 bg-gray-800 rounded-full text-gray-300">
                  ⏱️ {recipe.data.preparation_time} mins
                </span>
                <span className="px-3 py-1 bg-gray-800 rounded-full text-gray-300 capitalize">
                  {recipe.data.category}
                </span>
              </div>

              {/* Ingredients */}
              <div>
                <h4 className="font-semibold mb-2 text-gray-200">Ingredients:</h4>
                <ul className="space-y-2">
                  {recipe.data.ingredients.map((ingredient, index) => (
                    <li 
                      key={index} 
                      className={`text-sm ${
                        ingredient.pantry_item_id ? 'text-gray-200' : 'text-yellow-500'
                      }`}
                    >
                      {ingredient.quantity} {ingredient.unit} {ingredient.name}
                      {ingredient.substitutes && ingredient.substitutes.length > 0 && (
                        <div className="text-xs text-gray-400 mt-1">
                          Substitutes: {ingredient.substitutes.join(', ')}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Instructions */}
              <div>
                <h4 className="font-semibold mb-2 text-gray-200">Instructions:</h4>
                <ol className="space-y-2">
                  {recipe.data.instructions.map((step, index) => (
                    <li key={index} className="text-sm text-gray-300">
                      {index + 1}. {step}
                    </li>
                  ))}
                </ol>
              </div>


              <div className="flex justify-end gap-4 pt-4">
                <button
                  onClick={handleRemove}
                  className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                >
                  Clear Recipe
                </button>
                <button
                  onClick={onUse}
                  className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Use Recipe
                </button>
              </div>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
