import { Recipe } from '@/types';

interface RecipeStatsProps {
  recipe: Recipe;
  availability?: number;
  className?: string;
}

export function RecipeStats({ recipe, availability, className = '' }: RecipeStatsProps) {
  return (
    <div className={`grid grid-cols-2 items-center text-sm ${className}`}>
      <div className="flex flex-wrap items-center gap-2 text-gray-400">
        <span className="whitespace-nowrap">⏱️ {recipe.data.preparation_time}m</span>
        {recipe.data.nutrition?.calories && (
          <span className="whitespace-nowrap">🔥 {recipe.data.nutrition.calories}cal</span>
        )}
        {recipe.data.nutrition?.protein && (
          <span className="whitespace-nowrap">💪 {recipe.data.nutrition.protein}g</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 justify-end text-gray-400">
        {recipe.data.price && (
          <span className="whitespace-nowrap">${recipe.data.price.toFixed(2)}</span>
        )}
        {availability !== undefined && (
          <span className={`whitespace-nowrap flex items-center gap-1 ${
            availability >= 75 ? 'text-green-400' : 
            availability >= 50 ? 'text-yellow-400' : 
            'text-red-400'
          }`}>
            🥫 {Math.round(availability)}%
          </span>
        )}
      </div>
    </div>
  );
}
