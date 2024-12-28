import { CookData, RateData, Recipe, RecipeInteraction, SaveData } from '@/types';
import { Dialog } from '@headlessui/react';
import { PantryItem } from '@/types';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { recipeApi } from '@/lib/api';
import { track } from '@vercel/analytics';
import { StarRating } from './StarRating';
import { motion } from 'framer-motion';
import { calculateRecipeAvailability } from '@/stores/recipeStore';

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
  const [isIngredientsExpanded, setIsIngredientsExpanded] = useState(true);
  const [isInstructionsExpanded, setIsInstructionsExpanded] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [existingInteractions, setExistingInteractions] = useState<RecipeInteraction[]>([]);

  useEffect(() => {
    const fetchInteractions = async () => {
      try {
        const interactions = await recipeApi.getInteractions(recipe.id);
        setExistingInteractions(interactions);
        
        // Set initial states based on interactions
        const saveInteraction = interactions.find(i => i.type === 'save');
        const rateInteraction = interactions.find(i => i.type === 'rate');
        
        if (saveInteraction) {
          setIsSaved(true);
        }
        
        if (rateInteraction && isRateData(rateInteraction.data)) {
          setRating(rateInteraction.rating || 0);
          setReview(rateInteraction.data.review || '');
        }
      } catch (error) {
        console.error('Error fetching recipe interactions:', error);
      }
    };

    fetchInteractions();
  }, [recipe.id]);

  // Add type guard function
  const isRateData = (data: SaveData | RateData | CookData): data is RateData => {
    return 'rating' in data;
  };

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
      setIsSaved(true);
      track('save_recipe', {
        recipeName: recipe.data.name,
        ingredientCount: recipe.data.ingredients.length
      });
      toast.success('Recipe saved to cookbook');
    } catch (error) {
      console.error('Error saving recipe:', error);
      if (error instanceof Error && error.message.includes('duplicate key value')) {
        setIsSaved(true);
        toast.success('Recipe already in cookbook');
      } else {
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
          <Dialog.Panel className="w-full max-w-3xl rounded-xl bg-gray-900 p-8 shadow-xl">
            {/* Recipe Header */}
            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Dialog.Title className="text-2xl font-bold text-white">
                    {recipe.data.name}
                  </Dialog.Title>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="px-3 py-1 bg-gray-800 rounded-full text-gray-300">
                        ⏱️ {recipe.data.preparation_time} mins
                      </span>
                      <span className="px-3 py-1 bg-gray-800 rounded-full text-gray-300 capitalize">
                        {recipe.data.category}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <button 
                        onClick={() => setShowRatingInput(true)}
                        className="flex items-center gap-1 text-gray-400 hover:text-yellow-400"
                      >
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className={star <= rating ? 'text-yellow-400' : 'text-gray-400'}
                          >
                            {star <= rating ? '★' : '☆'}
                          </span>
                        ))}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`flex items-center gap-1 disabled:opacity-50 ${
                          isSaved ? 'text-red-400' : 'text-gray-400 hover:text-red-400'
                        }`}
                      >
                        {isSaving ? '...' : (isSaved ? '❤️' : '♡')}
                      </button>
                      <span className={
                        calculateRecipeAvailability(recipe, pantryItems).percentage >= 75 ? 'text-green-400' : 
                        calculateRecipeAvailability(recipe, pantryItems).percentage >= 50 ? 'text-yellow-400' : 
                        'text-red-400'
                      }>
                        {calculateRecipeAvailability(recipe, pantryItems).percentage}%
                      </span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Rating Input */}
            {showRatingInput && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-3 bg-gray-800/50 p-6 rounded-lg mb-6"
              >
                <div className="space-y-2">
                  <StarRating
                    rating={rating}
                    onChange={setRating}
                    disabled={isRating}
                  />
                  <textarea
                    value={review}
                    onChange={(e) => setReview(e.target.value)}
                    disabled={isRating}
                    className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white min-h-[80px]"
                    placeholder="Share your thoughts about this recipe..."
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => setShowRatingInput(false)}
                    className="px-4 py-2 text-sm text-gray-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRate}
                    disabled={isRating || rating === 0}
                    className="px-4 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                  >
                    {isRating ? 'Saving...' : 'Save Rating'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Main Content Sections */}
            <div className="space-y-4">
              {/* Ingredients */}
              <div>
                <button 
                  onClick={() => setIsIngredientsExpanded(!isIngredientsExpanded)}
                  className="w-full flex justify-between items-center p-3 -mx-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <h4 className="font-semibold text-gray-200">Ingredients</h4>
                  <span className="text-gray-400">
                    {isIngredientsExpanded ? '−' : '+'}
                  </span>
                </button>
                <div className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${isIngredientsExpanded ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                `}>
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
              </div>

              {/* Divider */}
              <div className="border-t border-gray-800" />

              {/* Instructions */}
              <div>
                <button 
                  onClick={() => setIsInstructionsExpanded(!isInstructionsExpanded)}
                  className="w-full flex justify-between items-center p-3 -mx-3 hover:bg-gray-800/50 rounded-lg transition-colors"
                >
                  <h4 className="font-semibold text-gray-200">Instructions</h4>
                  <span className="text-gray-400">
                    {isInstructionsExpanded ? '−' : '+'}
                  </span>
                </button>
                <div className={`
                  overflow-hidden transition-all duration-300 ease-in-out
                  ${isInstructionsExpanded ? 'max-h-[1000px] opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}
                `}>
                  <ol className="space-y-2">
                    {recipe.data.instructions.map((step, index) => (
                      <li key={index} className="text-sm text-gray-300">
                        {index + 1}. {step}
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
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
                onClick={onUse}
                className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Use Recipe
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
