import { Recipe } from '@/types';
import { PantryItem } from '@/types';
import { calculateRecipeAvailability } from '@/stores/recipeStore';
import { recipeApi } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface RecipeCardPreviewProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  onClick?: () => void;
}

export default function RecipeCardPreview({ recipe, pantryItems, onClick }: RecipeCardPreviewProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveAnimation, setShowSaveAnimation] = useState(false);
  const { percentage } = calculateRecipeAvailability(recipe, pantryItems);

  const getAvailabilityStyle = (percentage: number) => {
    if (percentage >= 80) return "bg-green-900/30 hover:bg-green-800/30";
    if (percentage >= 50) return "bg-yellow-900/30 hover:bg-yellow-800/30";
    return "bg-red-900/30 hover:bg-red-800/30";
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isSaving) return;

    try {
      setIsSaving(true);
      await recipeApi.saveRecipe(recipe.id);
      setShowSaveAnimation(true);
      setTimeout(() => setShowSaveAnimation(false), 1000);
      toast.success('Recipe saved to cookbook');
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('duplicate key value'))) {
        toast.error('Failed to save recipe');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      onClick={onClick}
      className={`backdrop-blur-sm p-5 rounded-lg cursor-pointer transition-colors min-h-[140px] flex flex-col justify-between group relative
        ${getAvailabilityStyle(percentage)}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <AnimatePresence>
        {showSaveAnimation && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 1.5, opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="text-4xl">💾</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="absolute top-3 right-3 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        <motion.span 
          className="text-blue-400 hover:text-blue-300 inline-block"
          whileTap={{ scale: 0.9 }}
        >
          {isSaving ? '...' : '💾'}
        </motion.span>
      </button>

      <h4 className="font-medium text-white text-base leading-snug line-clamp-3 pr-8">
        {recipe.data.name}
      </h4>

      <div className="flex items-center justify-between text-sm mt-3">
        <div className="text-gray-400">⏱️ {recipe.data.preparation_time}m</div>
        <div className="text-gray-300">
          {Math.round(percentage)}%
        </div>
      </div>
    </motion.div>
  );
}
