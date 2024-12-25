import { useState, useEffect } from 'react';
import { Recipe, PantryItem } from '@/types';
import { recipeApi } from '@/lib/api';
import RecipeCardPreview from './recipes/RecipeCardPreview';
import RecipeDetailModal from './recipes/RecipeDetailModal';
import RecipeUseModal from './recipes/use-recipe/RecipeUseModal';
import { toast } from 'react-hot-toast';
import { usePantryStore } from '@/stores/pantryStore';
import { useRecipeStore } from '@/stores/recipeStore';
import { RecipeCollectionHeader } from './recipes/RecipeCollectionHeader';
import { RecipeGenerationGroup } from './recipes/RecipeGenerationGroup';
import ElfModal from './modals/ElfModal';

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
  const [showElfModal, setShowElfModal] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await recipeApi.getAll();
        setRecipes(response);
      } catch (error) {
        console.error('Error fetching recipes:', error);
        setError('Failed to load recipes');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecipes();
  }, [setIsLoading, setError, setRecipes]);

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

  // Group recipes by generation timestamp and sort within groups by availability
  const groupedRecipes = recipes.reduce((groups, recipe) => {
    const timestamp = recipe.created_at.split('T')[0];
    if (!groups[timestamp]) groups[timestamp] = [];
    groups[timestamp].push(recipe);
    return groups;
  }, {} as Record<string, Recipe[]>);

  // Sort recipes within each group by availability
  Object.values(groupedRecipes).forEach(recipeGroup => {
    recipeGroup.sort((a, b) => {
      const calcAvailability = (recipe: Recipe) => {
        const total = recipe.data.ingredients.length;
        if (total === 0) return 0;
        
        const available = recipe.data.ingredients.filter(ing => 
          pantryItems.some(item => 
            item.data.name && 
            item.data.name.toLowerCase() === ing.name.toLowerCase()
          )
        ).length;
        
        return available / total;
      };

      return calcAvailability(b) - calcAvailability(a);
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
        onGenerateNew={() => setShowElfModal(true)}
        pantryItemsCount={pantryItems.length}
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
        sortedTimestamps.map(timestamp => (
          <RecipeGenerationGroup
            key={timestamp}
            timestamp={timestamp}
            recipes={groupedRecipes[timestamp]}
            pantryItems={pantryItems}
            preferences={preferences}
            onSelectRecipe={setSelectedRecipe}
          />
        ))
      )}

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onUse={() => setUsingRecipe(selectedRecipe)}
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

      {showElfModal && (
        <ElfModal
          onClose={() => setShowElfModal(false)}
          pantryItemsCount={pantryItems.length}
        />
      )}
    </div>
  );
}
