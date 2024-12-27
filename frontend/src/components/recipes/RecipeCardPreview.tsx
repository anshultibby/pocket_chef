import { Recipe } from '@/types';
import { PantryItem } from '@/types';
import { calculateRecipeAvailability } from '@/stores/recipeStore';

interface RecipeCardPreviewProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  onClick?: () => void;
}

export default function RecipeCardPreview({ recipe, pantryItems, onClick }: RecipeCardPreviewProps) {
  const { percentage } = calculateRecipeAvailability(recipe, pantryItems);

  const getAvailabilityColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-400";
    if (percentage >= 50) return "text-yellow-400";
    return "text-red-400";
  };

  return (
    <div 
      onClick={onClick}
      className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-lg cursor-pointer hover:bg-gray-700/50 transition-colors min-h-[100px] flex flex-col justify-between"
    >
      <h4 className="font-medium text-white text-lg leading-tight line-clamp-2">
        {recipe.data.name}
      </h4>
      <div className="flex items-center justify-between text-sm mt-2">
        <div className="text-gray-400">⏱️ {recipe.data.preparation_time}m</div>
        <div className={getAvailabilityColor(percentage)}>
          {percentage}%
        </div>
      </div>
    </div>
  );
}
