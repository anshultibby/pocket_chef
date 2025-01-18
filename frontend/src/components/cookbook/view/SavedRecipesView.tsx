import { Recipe, PantryItem } from '@/types';
import { RecipeCard } from '../components/RecipeCard';
import { InteractionWithRecipe } from '../types';

interface SavedRecipesViewProps {
  interactions: InteractionWithRecipe[];
  pantryItems: PantryItem[];
  onSelectRecipe: (recipe: Recipe) => void;
}

export function SavedRecipesView({ 
  interactions, 
  pantryItems,
  onSelectRecipe 
}: SavedRecipesViewProps) {
  if (interactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No saved recipes yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          Save recipes while browsing to add them to your cookbook.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 px-4 sm:px-6 lg:px-8">
      {interactions.map(interaction => (
        <RecipeCard
          key={interaction.id}
          recipe={interaction.recipe}
          interaction={interaction}
          pantryItems={pantryItems}
          onClick={() => onSelectRecipe(interaction.recipe)}
        />
      ))}
    </div>
  );
}
