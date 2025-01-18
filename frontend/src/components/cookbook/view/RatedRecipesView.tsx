import { PantryItem, Recipe } from '@/types';
import { RecipeCard } from '../components/RecipeCard';
import { useState, useMemo, useCallback } from 'react';
import { InteractionWithRecipe } from '../types';

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

  // Memoize sorted interactions
  const sortedInteractions = useMemo(() => {
    return [...interactions].sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating ?? 0) - (a.rating ?? 0);
      }
      // Pre-calculate dates once
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });
  }, [interactions, sortBy]);

  // Memoize recipe selection callback
  const handleRecipeSelect = useCallback((recipe: Recipe) => {
    onSelectRecipe(recipe);
  }, [onSelectRecipe]);

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
            onClick={() => handleRecipeSelect(interaction.recipe)}
          />
        ))}
      </div>
    </div>
  );
}
