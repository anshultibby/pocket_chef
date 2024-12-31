import { Recipe, PantryItem } from '@/types';
import { useDraggable } from '@dnd-kit/core';
import RecipeCardPreview from '../recipes/RecipeCardPreview';

interface RecipeSuggestionsProps {
  recipes: Recipe[];
  pantryItems: PantryItem[];
  onSelectRecipe: (recipe: Recipe) => void;
}

function DraggableRecipeCard({ recipe, index, pantryItems, onSelect }: {
  recipe: Recipe;
  index: number;
  pantryItems: PantryItem[];
  onSelect: (recipe: Recipe) => void;
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: recipe.id,
    data: { recipe, index }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
    >
      <RecipeCardPreview
        recipe={recipe}
        pantryItems={pantryItems}
        onClick={() => onSelect(recipe)}
      />
    </div>
  );
}

export function RecipeSuggestions({
  recipes,
  pantryItems,
  onSelectRecipe,
}: RecipeSuggestionsProps) {
  // Group recipes by date like in RecipesTab
  const groupedRecipes = recipes.reduce((acc: Record<string, Recipe[]>, recipe: Recipe) => {
    const date = new Date(recipe.created_at);
    const dateString = date.toISOString().split('T')[0];
    
    if (!acc[dateString]) {
      acc[dateString] = [];
    }
    if (acc[dateString].length < 10) {
      acc[dateString].push(recipe);
    }
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedRecipes)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 2); // Show only last 2 generations

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Recipe Suggestions</h2>
      <p className="text-sm text-gray-400">
        Drag recipes to add them to your meal plan, or click for details
      </p>

      <div className="space-y-6">
        {sortedDates.map((date) => (
          <div key={date} className="space-y-4">
            <h3 className="text-sm font-medium text-gray-400">
              {date === sortedDates[0] ? 'Latest Suggestions' : 'Previous Suggestions'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {groupedRecipes[date].map((recipe, index) => (
                <DraggableRecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  index={index}
                  pantryItems={pantryItems}
                  onSelect={onSelectRecipe}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
