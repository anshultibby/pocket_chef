import { useState, useEffect, useMemo } from 'react';
import { Recipe, PantryItem } from '@/types';
import RecipeDetailModal from './recipes/RecipeDetailModal';
import RecipeUseModal from './recipes/use-recipe/RecipeUseModal';
import { useRecipeStore } from '@/stores/recipeStore';
import { RecipeCollectionHeader } from './recipes/RecipeCollectionHeader';
import { RecipeGenerationGroup } from './recipes/RecipeGenerationGroup';
import ElfModal from './modals/ElfModal';
import { calculateRecipeAvailability } from '@/stores/recipeStore';
import { motion, AnimatePresence } from 'framer-motion';

interface RecipesTabProps {
  pantryItems: PantryItem[];
  loading: boolean;
}

export default function RecipesTab({
  pantryItems,
}: RecipesTabProps) {
  const { 
    recipes,
    preferences,
    isLoading,
    isGenerating,
    error,
    fetchRecipes,
    setIsGenerating,
  } = useRecipeStore();
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [usingRecipe, setUsingRecipe] = useState<Recipe | null>(null);
  const [showElfModal, setShowElfModal] = useState(false);

  useEffect(() => {
    fetchRecipes().catch(console.error);
  }, [fetchRecipes]);

  // Group recipes by timestamp
  const groupedRecipes = useMemo(() => {
    return recipes.reduce((acc, recipe) => {
      const timestamp = recipe.created_at;
      if (!acc[timestamp]) {
        acc[timestamp] = [];
      }
      acc[timestamp].push(recipe);
      return acc;
    }, {} as Record<string, Recipe[]>);
  }, [recipes]);

  const handleRemoveRecipe = (recipeId: string) => {
    useRecipeStore.getState().setRecipes(prevRecipes => 
      prevRecipes.filter(recipe => recipe.id !== recipeId)
    );
  };

  // Sort recipes within each group by availability
  Object.values(groupedRecipes).forEach(recipeGroup => {
    recipeGroup.sort((a, b) => {
      const getAvailability = (recipe: Recipe) => {
        const { percentage } = calculateRecipeAvailability(recipe, pantryItems);
        return percentage;
      };
      return getAvailability(b) - getAvailability(a);
    });
  });

  // Sort timestamps in reverse chronological order
  const sortedTimestamps = Object.keys(groupedRecipes).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  return (
    <div className="space-y-8">
      <RecipeCollectionHeader
        recipesCount={recipes.length}
        lastGeneratedAt={sortedTimestamps[0]}
      />

      {error && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {(isLoading || isGenerating) ? (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">
            {isGenerating ? 'Generating your recipes...' : 'Loading recipes...'}
          </p>
        </div>
      ) : (
        <div className="relative h-[500px] flex justify-center items-center">
          <AnimatePresence>
            {sortedTimestamps.map((timestamp, index) => (
              <motion.div
                key={timestamp}
                className="absolute w-full max-w-2xl"
                initial={{ scale: 0.8, y: 50, opacity: 0 }}
                animate={{
                  scale: 1,
                  y: -index * 4, // Stack offset
                  opacity: 1,
                  rotateZ: (index - sortedTimestamps.length / 2) * 2, // Slight rotation
                  zIndex: sortedTimestamps.length - index,
                }}
                exit={{ scale: 0.8, y: 50, opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{
                  filter: `brightness(${100 - index * 5}%)`, // Darker cards in back
                }}
              >
                <RecipeGenerationGroup
                  timestamp={timestamp}
                  recipes={groupedRecipes[timestamp]}
                  pantryItems={pantryItems}
                  preferences={preferences}
                  onSelectRecipe={setSelectedRecipe}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onUse={() => setUsingRecipe(selectedRecipe)}
          onRemove={() => {
            handleRemoveRecipe(selectedRecipe.id);
            setSelectedRecipe(null);
          }}
          pantryItems={pantryItems}
        />
      )}

      {usingRecipe && (
        <RecipeUseModal
          recipe={usingRecipe}
          pantryItems={pantryItems}
          onClose={() => setUsingRecipe(null)}
        />
      )}

      {showElfModal && (
        <ElfModal
          onClose={() => setShowElfModal(false)}
          pantryItemsCount={pantryItems.length}
        />
      )}
    </div>
  );
}
