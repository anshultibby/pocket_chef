import { Recipe } from '@/types';
import { Dialog } from '@headlessui/react';
import { PantryItem } from '@/types';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { recipeApi } from '@/lib/api';
import { track } from '@vercel/analytics';

interface RecipeDetailModalProps {
  recipe: Recipe;
  onClose: () => void;
  onUse: () => void;
  onRemove: () => void;
  pantryItems: PantryItem[];
}

export default function RecipeDetailModal({ recipe, onClose, onUse, onRemove, pantryItems }: RecipeDetailModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isRating, setIsRating] = useState(false);
  const [rating, setRating] = useState<number>(0);
  const [review, setReview] = useState<string>('');
  const [showRatingInput, setShowRatingInput] = useState(false);

  const getIngredientStatus = (ingredient: Recipe['data']['ingredients'][0]) => {
    const inPantry = pantryItems.find(item => 
      item.data.name && 
      item.data.name.toLowerCase() === ingredient.name.toLowerCase()
    );

    if (inPantry) return 'text-green-400';
    if (ingredient.substitutes && ingredient.substitutes.length > 0) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await recipeApi.saveRecipe(recipe.id);
      track('save_recipe', {
        recipeName: recipe.data.name,
        ingredientCount: recipe.data.ingredients.length
      });
      toast.success('Recipe saved to cookbook');
    } catch (error) {
      console.error('Error saving recipe:', error);
      if (!(error instanceof Error && error.message.includes('duplicate key value'))) {
        toast.error('Failed to save recipe');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleRate = async () => {
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setIsRating(true);
      await recipeApi.rateRecipe(recipe.id, rating, review);
      track('rate_recipe', {
        recipeName: recipe.data.name,
        rating,
        hasReview: !!review
      });
      toast.success('Rating saved');
      setShowRatingInput(false);
    } catch (error) {
      console.error('Error rating recipe:', error);
      toast.error('Failed to save rating');
    } finally {
      setIsRating(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-gray-900 p-6 shadow-xl">
            {/* Recipe Header */}
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

            {/* Recipe Content */}
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

              {/* Rating Input */}
              {showRatingInput && (
                <div className="space-y-3 bg-gray-800/50 p-4 rounded-lg">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-gray-600'}`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    placeholder="Add a review (optional)"
                    className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white placeholder-gray-500"
                    rows={3}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowRatingInput(false)}
                      className="px-3 py-1 text-gray-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRate}
                      disabled={isRating}
                      className="px-3 py-1 bg-yellow-500 text-white rounded-lg hover:bg-yellow-400 disabled:opacity-50"
                    >
                      {isRating ? 'Saving...' : 'Save Rating'}
                    </button>
                  </div>
                </div>
              )}

              {/* Ingredients */}
              <div>
                <h4 className="font-semibold mb-2 text-gray-200">Ingredients:</h4>
                <ul className="space-y-2">
                  {recipe.data.ingredients.map((ingredient, index) => (
                    <li 
                      key={index} 
                      className={`text-sm ${getIngredientStatus(ingredient)}`}
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

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  onClick={onRemove}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-300"
                >
                  Remove Recipe
                </button>
                <button
                  onClick={() => setShowRatingInput(true)}
                  className="px-4 py-2 text-sm bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30"
                >
                  Rate Recipe
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 text-sm bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Recipe'}
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
