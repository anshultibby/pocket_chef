import { useState } from 'react';
import { Recipe, PantryItem } from '@/types';
import { recipeApi } from '@/lib/api';
import RecipeGenerationControls from './recipes/RecipeGenerationControls';
import RecipeCardPreview from './recipes/RecipeCardPreview';
import RecipeDetailModal from './recipes/RecipeDetailModal';
import RecipeUseModal from './recipes/use-recipe/RecipeUseModal';
import { toast } from 'react-hot-toast';
import { usePantryStore } from '@/stores/pantryStore';
import { useRecipeStore } from '@/stores/recipeStore';

interface RecipesTabProps {
  pantryItems: PantryItem[];
  loading: boolean;
}

export default function RecipesTab({
  pantryItems,
}: RecipesTabProps) {
  const { fetchItems } = usePantryStore();
  const { 
    recipes,
    preferences,
    isLoading,
    isGenerating,
    error,
    setRecipes,
    setIsLoading,
    setIsGenerating,
    setError,
  } = useRecipeStore();
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [usingRecipe, setUsingRecipe] = useState<Recipe | null>(null);

  const handleGenerateRecipes = async () => {
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);

    try {
      const newRecipes = await recipeApi.generate(preferences);
      setRecipes(newRecipes);
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  const handleError = (err: unknown) => {
    let message = 'An error occurred';
    if (err instanceof Error) message = err.message;
    else if (typeof err === 'string') message = err;
    setError(message);
    console.error('Recipe error:', err);
    setIsGenerating(false);
    setIsLoading(false);
  };

  const handleUseRecipe = async (ingredientsUsed: Record<string, number>) => {
    if (!usingRecipe) return;

    try {
      await recipeApi.use(usingRecipe.id, {
        servings_made: usingRecipe.data.servings,
        ingredients_used: ingredientsUsed,
      });

      await fetchItems();
      setUsingRecipe(null);
      setSelectedRecipe(null);
    } catch (error) {
      console.error('Error using recipe:', error);
      toast.error('Failed to use recipe');
    }
  };

  return (
    <div className="space-y-8">
      <RecipeGenerationControls
        onGenerate={handleGenerateRecipes}
        isGenerating={isGenerating}
        isLoading={isLoading}
        pantryItemsCount={pantryItems.length}
      />

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
          recipe={usingRecipe}
          pantryItems={pantryItems}
          onClose={() => setUsingRecipe(null)}
          onConfirmUse={handleUseRecipe}
        />
      )}
    </div>
  );
}
