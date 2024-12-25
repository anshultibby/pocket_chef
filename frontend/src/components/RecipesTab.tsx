import { Recipe, PantryItem } from '@/types';
import RecipeCardPreview from './recipes/RecipeCardPreview';
import RecipeDetailModal from './recipes/RecipeDetailModal';
import RecipeUseModal from './recipes/use-recipe/RecipeUseModal';
import { useRecipeStore } from '@/stores/recipeStore';

interface RecipesTabProps {
  pantryItems: PantryItem[];
  loading: boolean;
}

export default function RecipesTab({
  pantryItems,
}: RecipesTabProps) {
  const { 
    recipes,
    isLoading,
    isGenerating,
    error,
    selectedRecipe,
    usingRecipe,
    setSelectedRecipe,
    setRecipes,
    initializeUseRecipe,
    closeUseRecipe,
    setUsingRecipe
  } = useRecipeStore();

  const handleUseRecipe = async (ingredientsUsed: Record<string, number>) => {
    if (!usingRecipe?.recipe) return;
    await initializeUseRecipe(usingRecipe.recipe, pantryItems);
  };

  const handleCloseUseRecipe = () => {
    closeUseRecipe();
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {(isLoading || isGenerating) && (
        <div className="text-center py-8">
          <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-400">
            {isGenerating ? 'Generating your recipes...' : 'Loading recipes...'}
          </p>
        </div>
      )}

      {!isLoading && !isGenerating && recipes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <RecipeCardPreview
              key={recipe.id}
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
            />
          ))}
        </div>
      )}

      {!isLoading && !isGenerating && recipes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            No recipes yet. Click &quot;Generate Recipes&quot; to get started!
          </p>
        </div>
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onRemove={() => {
            setRecipes([]);
            setSelectedRecipe(null);
          }}
          onUse={() => {
            setUsingRecipe(selectedRecipe);
            setSelectedRecipe(null);
          }}
        />
      )}

      {usingRecipe && (
        <RecipeUseModal
          recipe={usingRecipe.recipe!}
          pantryItems={pantryItems}
          onClose={handleCloseUseRecipe}
          onConfirmUse={handleUseRecipe}
        />
      )}
    </div>
  );
}
