import { Recipe, PantryItem } from '@/types';
import { useDroppable } from '@dnd-kit/core';
import { useMealPlanStore } from '@/stores/mealPlanStore';
import RecipeCardPreview from '../recipes/RecipeCardPreview';

interface CurrentMealPlanProps {
  onSelectRecipe: (recipe: Recipe) => void;
  pantryItems: PantryItem[];
}

export function CurrentMealPlan({ onSelectRecipe, pantryItems }: CurrentMealPlanProps) {
  const { mealPlan } = useMealPlanStore();
  const recipes = mealPlan.current || [];
  
  const { setNodeRef } = useDroppable({
    id: 'meal-plan',
  });

  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Current Meal Plan</h2>
            <p className="text-sm text-gray-400 mt-1">
              Drag recipes here to add them to your meal plan
            </p>
          </div>
          <span className="text-sm text-gray-400">
            {recipes.length} recipes planned
          </span>
        </div>
      </div>

      <div ref={setNodeRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {recipes.map((recipe) => (
          <RecipeCardPreview
            key={recipe.id}
            recipe={recipe}
            pantryItems={pantryItems}
            onClick={() => onSelectRecipe(recipe)}
          />
        ))}
      </div>
    </div>
  );
}
