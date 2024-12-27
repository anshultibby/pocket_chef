import { useState, useEffect, useMemo } from 'react';
import { Recipe, PantryItem } from '@/types';
import RecipeDetailModal from './recipes/RecipeDetailModal';
import RecipeUseModal from './recipes/use-recipe/RecipeUseModal';
import { useRecipeStore } from '@/stores/recipeStore';
import ElfModal from './modals/ElfModal';
import { calculateRecipeAvailability } from '@/stores/recipeStore';
import RecipeCardPreview from './recipes/RecipeCardPreview';
import { toast } from 'react-hot-toast';

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
    useRecipe,
  } = useRecipeStore();
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [usingRecipe, setUsingRecipe] = useState<Recipe | null>(null);
  const [showElfModal, setShowElfModal] = useState(false);

  useEffect(() => {
    fetchRecipes().catch(console.error);
  }, [fetchRecipes]);

  // Group recipes by timestamp
  const groupedRecipes = useMemo(() => {
    return recipes.reduce((acc: Record<string, Recipe[]>, recipe: Recipe) => {
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
  }, [recipes]);

  const handleRemoveRecipe = (recipeId: string) => {
    useRecipeStore.getState().setRecipes((prevRecipes: Recipe[]) => 
      prevRecipes.filter(recipe => recipe.id !== recipeId)
    );
  };

  // Sort recipes within each group by availability
  (Object.values(groupedRecipes) as Recipe[][]).forEach(recipeGroup => {
    recipeGroup.sort((a, b) => {
      const getAvailability = (recipe: Recipe) => {
        const { percentage } = calculateRecipeAvailability(recipe, pantryItems);
        return percentage;
      };
      return getAvailability(b) - getAvailability(a);
    });
  });

  // Sort timestamps in reverse chronological order and limit to last 5 dates
  const sortedTimestamps = Object.keys(groupedRecipes)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-8">
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
        <div className="space-y-8">
          {/* Current Generation */}
          {sortedTimestamps[0] && (
            <div>
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                Current Generation
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedRecipes[sortedTimestamps[0]].slice(0, 8).map((recipe) => (
                  <RecipeCardPreview
                    key={recipe.id}
                    recipe={recipe}
                    pantryItems={pantryItems}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Previous Generations */}
          {sortedTimestamps.slice(1).map((timestamp) => (
            <div key={timestamp}>
              <h3 className="text-sm font-medium text-gray-400 mb-4">
                {new Date(timestamp).toLocaleDateString()}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {groupedRecipes[timestamp].slice(0, 4).map((recipe) => (
                  <RecipeCardPreview
                    key={recipe.id}
                    recipe={recipe}
                    pantryItems={pantryItems}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onUse={() => {
            setUsingRecipe(selectedRecipe);
            setSelectedRecipe(null);
          }}
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
          onConfirmUse={async (ingredientsUsed) => {
            try {
              await useRecipe(usingRecipe.id, usingRecipe.data.servings, ingredientsUsed);
              setUsingRecipe(null);
            } catch (error) {
              console.error('Error using recipe:', error);
              toast.error('Failed to use recipe');
            }
          }}
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
