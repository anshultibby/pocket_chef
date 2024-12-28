import { Recipe, PantryItem, RateData, SaveData, CookData } from '@/types';
import { formatDate } from '@/lib/utils';
import { InteractionWithRecipe } from '../types';
import { calculateRecipeAvailability } from '@/stores/recipeStore';
import { motion } from 'framer-motion';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

interface RecipeCardProps {
  recipe: Recipe;
  interaction: InteractionWithRecipe;
  pantryItems: PantryItem[];
  onClick: () => void;
}

export function RecipeCard({ recipe, interaction, pantryItems, onClick }: RecipeCardProps) {
  // Type guard functions
  const isCookData = (data: SaveData | RateData | CookData): data is CookData => {
    return interaction.type === 'cook';
  };

  const isRateData = (data: SaveData | RateData | CookData): data is RateData => {
    return interaction.type === 'rate';
  };

  const isSaveData = (data: SaveData | RateData | CookData): data is SaveData => {
    return interaction.type === 'save';
  };

  const { percentage: availability } = calculateRecipeAvailability(recipe, pantryItems);

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  const StarRating = ({ rating }: { rating: number }) => {
    return (
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star}>
            {star <= (rating ?? 0) ? (
              <StarIcon className="h-5 w-5 text-yellow-400" />
            ) : (
              <StarIconOutline className="h-5 w-5 text-yellow-400" />
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <motion.div 
      onClick={onClick}
      className="bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ 
        scale: 1.02,
        backgroundColor: 'rgb(55, 65, 81)', // Equivalent to hover:bg-gray-700
      }}
      transition={{ 
        duration: 0.2,
        type: "spring",
        stiffness: 300
      }}
    >
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-white">
            {recipe.data.name}
          </h3>
          {isRateData(interaction.data) && (
            <motion.div 
              className="flex items-center gap-1"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <StarRating rating={interaction.data.rating} />
            </motion.div>
          )}
        </div>

        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between text-sm text-gray-400">
            <span>{recipe.data.preparation_time} mins</span>
            <motion.span
              initial={{ x: 20 }}
              animate={{ x: 0 }}
              transition={{ delay: 0.3 }}
              className={getAvailabilityColor(availability)}
            >
              {availability}% available
            </motion.span>
          </div>

          {isSaveData(interaction.data) && interaction.data.folder && (
            <motion.div 
              className="text-sm text-gray-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Folder: {interaction.data.folder}
            </motion.div>
          )}

          {isRateData(interaction.data) && interaction.data.review && (
            <motion.p 
              className="text-sm text-gray-300 italic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              &ldquo;{interaction.data.review}&rdquo;
            </motion.p>
          )}

          {isCookData(interaction.data) && (
            <motion.div 
              className="text-sm text-gray-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <p>Servings made: {interaction.data.servings_made}</p>
              {interaction.data.notes && (
                <p className="text-gray-300 mt-1">
                  Notes: {interaction.data.notes}
                </p>
              )}
            </motion.div>
          )}

          <motion.div 
            className="text-xs text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {interaction.type === 'save' ? 'Saved' : 
             interaction.type === 'rate' ? 'Rated' : 'Cooked'} on {formatDate(interaction.created_at)}
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}
