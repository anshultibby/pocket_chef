import { PantryItem, Recipe } from '@/types';
import { RecipeCard } from '../components/RecipeCard';
import { useState } from 'react';
import { InteractionWithRecipe } from '../types';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarIconOutline } from '@heroicons/react/24/outline';

interface RatedRecipesViewProps {
  interactions: InteractionWithRecipe[];
  pantryItems: PantryItem[];
  onSelectRecipe: (recipe: Recipe) => void;
}

export function RatedRecipesView({ 
  interactions, 
  pantryItems,
  onSelectRecipe 
}: RatedRecipesViewProps) {
  const [sortBy, setSortBy] = useState<'date' | 'rating'>('rating');

  const sortedInteractions = [...interactions].sort((a, b) => {
    if (sortBy === 'rating') {
      return (b.rating ?? 0) - (a.rating ?? 0);
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'date' | 'rating')}
          className="bg-gray-700 text-white rounded-lg px-3 py-1"
        >
          <option value="rating">Sort by Rating</option>
          <option value="date">Sort by Date</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedInteractions.map(interaction => (
          <RecipeCard
            key={interaction.id}
            recipe={interaction.recipe}
            interaction={interaction}
            pantryItems={pantryItems}
            onClick={() => onSelectRecipe(interaction.recipe)}
          />
        ))}
      </div>
    </div>
  );
}
