import { Recipe, PantryItem } from '@/types';
import { CookingStats } from '../components/CookingStats';
import { RecipeCard } from '../components/RecipeCard';
import { InteractionWithRecipe } from '../types';

interface CookingHistoryViewProps {
  interactions: InteractionWithRecipe[];
  pantryItems: PantryItem[];
  onSelectRecipe?: (recipe: Recipe) => void;
}

export function CookingHistoryView({ 
  interactions, 
  pantryItems,
  onSelectRecipe 
}: CookingHistoryViewProps) {
  if (interactions.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No cooking history yet.</p>
        <p className="text-sm text-gray-500 mt-2">
          Start cooking recipes to build your history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <CookingStats interactions={interactions} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {interactions.map(interaction => (
          <RecipeCard
            key={interaction.id}
            recipe={interaction.recipe}
            interaction={interaction}
            pantryItems={pantryItems}
            onClick={() => onSelectRecipe?.(interaction.recipe)}
          />
        ))}
      </div>
    </div>
  );
}
