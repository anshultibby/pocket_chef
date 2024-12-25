import { Recipe } from '@/types';
import { PantryItem } from '@/types';

interface RecipeCardPreviewProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  onClick?: () => void;
}

export default function RecipeCardPreview({ recipe, pantryItems, onClick }: RecipeCardPreviewProps) {
  // Calculate availability percentage based on name matching
  const calculateAvailability = () => {
    const total = recipe.data.ingredients.length;
    if (total === 0) return { percentage: 0, available: 0, total };
    
    const available = recipe.data.ingredients.filter(ing => {
      const matchingPantryItem = pantryItems.find(item => 
        item.data.name && 
        item.data.name.toLowerCase() === ing.name.toLowerCase()
      );
      return matchingPantryItem !== undefined;
    }).length;
    
    return {
      percentage: (available / total) * 100,
      available,
      total
    };
  };

  // Helper function to determine availability status
  const getAvailabilityColor = (percentage: number) => {
    if (percentage === 100) return 'bg-green-500/20 border-green-500/30';
    if (percentage >= 80) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const { percentage, available, total } = calculateAvailability();
  const availabilityColor = getAvailabilityColor(percentage);

  return (
    <div 
      onClick={onClick}
      className={`border rounded-lg p-6 shadow-sm text-gray-100 cursor-pointer 
        hover:bg-opacity-80 transition-colors ${availabilityColor}`}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{recipe.data.name}</h3>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 bg-gray-700 rounded-full text-xs capitalize">
            {recipe.data.category}
          </span>
          <span className="text-xs">
            {available}/{total} ingredients ({percentage.toFixed(0)}%)
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Ingredient Preview */}
        <div className="text-sm text-gray-300">
          {recipe.data.ingredients.slice(0, 3).map((ingredient, i) => (
            <span key={i} className="inline-block mr-2">
              {ingredient.name}
              {i < Math.min(2, recipe.data.ingredients.length - 1) && ","}
              {i === 2 && recipe.data.ingredients.length > 3 && "..."}
            </span>
          ))}
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span>⏱️ {recipe.data.preparation_time} mins</span>
          <span>•</span>
          <span>{recipe.data.ingredients.length} ingredients</span>
        </div>
      </div>
    </div>
  );
}
