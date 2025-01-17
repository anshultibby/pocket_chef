import { Recipe } from '@/types';
import { PantryItem } from '@/types';
import { calculateRecipeAvailability } from '@/stores/recipeStore';
import { recipeApi } from '@/lib/api';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { RecipeStats } from './RecipeStats';

interface RecipeCardPreviewProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  onClick?: () => void;
}

export default function RecipeCardPreview({ recipe, pantryItems, onClick }: RecipeCardPreviewProps) {
  const { percentage } = calculateRecipeAvailability(recipe, pantryItems);

  const getAvailabilityStyle = (percentage: number) => {
    if (percentage >= 80) return "bg-green-900/30 hover:bg-green-800/30";
    if (percentage >= 50) return "bg-yellow-900/30 hover:bg-yellow-800/30";
    return "bg-red-900/30 hover:bg-red-800/30";
  };

  return (
    <motion.div 
      onClick={onClick}
      className={`backdrop-blur-sm p-5 rounded-lg cursor-pointer transition-colors min-h-[140px] flex flex-col justify-between
        ${getAvailabilityStyle(percentage)}`}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <div className="flex flex-col justify-between h-full">
        <h4 className="font-medium text-white text-base leading-snug line-clamp-3">
          {recipe.data.name}
        </h4>
        <RecipeStats 
          recipe={recipe} 
          availability={percentage}
          className="mt-3"
        />
      </div>
    </motion.div>
  );
}
