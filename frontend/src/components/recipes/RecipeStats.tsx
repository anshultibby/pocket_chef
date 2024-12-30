import { Recipe } from '@/types';

interface RecipeStatsProps {
  recipe: Recipe;
  availability?: number;
  className?: string;
}

export function RecipeStats({ recipe, availability, className = '' }: RecipeStatsProps) {
  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      <div className="flex items-center gap-3 text-gray-400">
        <span>⏱️ {recipe.data.preparation_time}m</span>
        {recipe.data.nutrition?.calories && (
          <span>🔥 {recipe.data.nutrition.calories}cal</span>
        )}
        {recipe.data.nutrition?.protein && (
          <span>💪 {recipe.data.nutrition.protein}g</span>
        )}
      </div>
      <div className="flex items-center gap-3">
        {recipe.data.price && (
          <span className="text-gray-400">${recipe.data.price.toFixed(2)}</span>
        )}
        {availability !== undefined && (
          <span className={
            availability >= 75 ? 'text-green-400' : 
            availability >= 50 ? 'text-yellow-400' : 
            'text-red-400'
          }>
            {Math.round(availability)}%
          </span>
        )}
      </div>
    </div>
  );
}
