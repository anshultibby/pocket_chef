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

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-red-400";
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
      className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors min-h-[100px] flex flex-col justify-between group relative"
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
        className="absolute top-2 right-2 p-2 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
      >
        <motion.span 
          className="text-blue-400 hover:text-blue-300 inline-block"
          whileTap={{ scale: 0.9 }}
        >
          {isSaving ? '...' : '💾'}
        </motion.span>
      </button>

      <h4 className="font-medium text-white text-lg leading-tight line-clamp-2 pr-8">
        {recipe.data.name}
      </h4>
      <div className="flex items-center justify-between text-sm mt-2">
        <div className="text-gray-400">⏱️ {recipe.data.preparation_time}m</div>
        <motion.div 
          className={getAvailabilityColor(percentage)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {percentage}%
        </motion.div>
      </div>
    </motion.div>
  );
}
