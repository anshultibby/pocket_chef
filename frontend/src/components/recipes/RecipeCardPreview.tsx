import { Recipe } from '@/types';

interface RecipeCardPreviewProps {
  recipe: Recipe;
  onClick: () => void;
}

export default function RecipeCardPreview({ recipe, onClick }: RecipeCardPreviewProps) {
  return (
    <div 
      onClick={onClick}
      className="border border-gray-700 rounded-lg p-6 bg-gray-800 shadow-sm text-gray-100 cursor-pointer hover:bg-gray-700/80 transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{recipe.data.name}</h3>
        <span className="px-2 py-1 bg-gray-700 rounded-full text-xs capitalize">
          {recipe.data.category}
        </span>
      </div>

      <div className="space-y-4">
        {/* Ingredient Preview */}
        <div className="text-sm text-gray-400">
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
