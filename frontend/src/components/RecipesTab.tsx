import { useState } from 'react';
import { 
  Recipe, 
  PantryItem, 
  RecipePreferences 
} from '@/types';
import { recipeApi } from '@/lib/api';
import RecipeGenerationControls from './recipes/RecipeGenerationControls';
import RecipeCardPreview from './recipes/RecipeCardPreview';
import RecipeDetailModal from './recipes/RecipeDetailModal';

interface RecipesTabProps {
  pantryItems: PantryItem[];
  loading: boolean;
}

export default function RecipesTab({
  pantryItems,
}: RecipesTabProps) {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [preferences, setPreferences] = useState<RecipePreferences>({
    cuisine: [],
    max_prep_time: undefined,
    dietary: [],
    serving_size: 2,
    meal_types: [],
    nutrition_goals: [],
    custom_preferences: '',
    recipes_per_meal: 3
  });
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);

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

  return (
    <div className="space-y-8">
      <RecipeGenerationControls
        onGenerate={handleGenerateRecipes}
        isGenerating={isGenerating}
        isLoading={isLoading}
        pantryItemsCount={pantryItems.length}
        preferences={preferences}
        onPreferencesChange={(updates) => setPreferences(prev => ({ ...prev, ...updates }))}
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
        />
      )}
    </div>
  );
}
