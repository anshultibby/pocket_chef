import { useState, useMemo, useEffect } from 'react';
import { Recipe, PantryItem, MealCategory } from '@/types';
import RecipeCard from './RecipeCard';
import { recipeApi } from '@/lib/api';

interface RecipesTabProps {
  onSaveRecipe: (recipe: Recipe) => Promise<void>;
  onRemoveRecipe: (id: string) => void;
  pantryItems: PantryItem[];
  loading: boolean;
}

export default function RecipesTab({
  onSaveRecipe,
  onRemoveRecipe,
  pantryItems,
  loading: parentLoading
}: RecipesTabProps) {
  const [generatedRecipes, setGeneratedRecipes] = useState<Recipe[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const recipesByCategory = useMemo(() => {
    const categories: Record<MealCategory, Recipe[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: []
    };
    
    generatedRecipes.forEach(recipe => {
      categories[recipe.meal_category].push(recipe);
    });
    
    return categories;
  }, [generatedRecipes]);

  const handleGenerateRecipes = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const recipes = await recipeApi.generate({
        ingredients: pantryItems.map(item => item.name)
      });
      setGeneratedRecipes(recipes);
    } catch (err: unknown) {
      let errorMessage = 'Failed to generate recipes';
      if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      console.error('Recipe generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const CategorySection = ({ title, recipes }: { title: string, recipes: Recipe[] }) => (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-white capitalize">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recipes.map(recipe => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            onSave={onSaveRecipe}
            onRemove={onRemoveRecipe}
          />
        ))}
      </div>
    </div>
  );

  useEffect(() => {
    const checkAndGenerateRecipes = async () => {
      if (pantryItems.length > 0 && generatedRecipes.length === 0) {
        await handleGenerateRecipes();
      }
    };

    checkAndGenerateRecipes();
  }, [pantryItems]); // Run when pantry items change

  return (
    <div className="space-y-8">
      {/* Recipe Generation Section */}
      <div className="bg-gray-900 rounded-lg border border-gray-800 overflow-hidden">
        <div className="p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Generate New Recipes</h2>
          <p className="text-gray-400 mt-2">
            Get personalized recipe suggestions based on your pantry
          </p>
        </div>

        <div className="p-6">
          <button
            onClick={handleGenerateRecipes}
            disabled={isGenerating || parentLoading}
            className="w-full bg-blue-500 text-white p-3 rounded-lg disabled:bg-gray-300 disabled:cursor-not-allowed hover:bg-blue-600 transition-colors"
          >
            {isGenerating ? 'Generating Recipes...' : 'Generate Recipes'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Recipe Results */}
      {Object.entries(recipesByCategory).map(([category, recipes]) => (
        <CategorySection key={category} title={category} recipes={recipes} />
      ))}
    </div>
  );
}
