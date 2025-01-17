import { useState, useEffect, useMemo } from 'react';
import { Recipe, PantryItem } from '@/types';
import RecipeDetailModal from './recipes/RecipeDetailModal';
import RecipeUseModal from './recipes/use-recipe/RecipeUseModal';
import { useRecipeStore } from '@/stores/recipeStore';
import ElfModal from './modals/ElfModal';
import RecipeCardPreview from './recipes/RecipeCardPreview';
import { toast } from 'react-hot-toast';
import { FloatingElfButton } from './FloatingElfButton';
import { ApiException } from '@/types/api';

interface RecipesTabProps {
  pantryItems: PantryItem[];
  loading: boolean;
}

interface RecipeFilters {
  prepTime: number | null;
  difficulty: string[];
  dietary: string[];
  sortBy: 'match' | 'time' | 'newest';
}

export function RecipeFilters({ filters, onChange }: { 
  filters: RecipeFilters;
  onChange: (filters: RecipeFilters) => void;
}) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-4 space-y-4">
      <div className="flex items-center gap-4">
        <label className="text-sm text-gray-400">Max Prep Time:</label>
        <input
          type="range"
          min="0"
          max="120"
          step="15"
          value={filters.prepTime || 0}
          onChange={(e) => onChange({
            ...filters,
            prepTime: Number(e.target.value) || null
          })}
          className="w-48"
        />
        <span className="text-sm text-gray-400">
          {filters.prepTime ? `${filters.prepTime}m` : 'Any'}
        </span>
      </div>

      <div className="flex gap-4">
        <select
          value={filters.sortBy}
          onChange={(e) => onChange({
            ...filters,
            sortBy: e.target.value as RecipeFilters['sortBy']
          })}
          className="bg-gray-700 rounded px-3 py-1 text-sm"
        >
          <option value="match">Sort by Match %</option>
          <option value="time">Sort by Prep Time</option>
          <option value="newest">Sort by Newest</option>
        </select>

        <div className="flex gap-2">
          {['Vegetarian', 'Vegan', 'Gluten-Free'].map(diet => (
            <button
              key={diet}
              onClick={() => onChange({
                ...filters,
                dietary: filters.dietary.includes(diet)
                  ? filters.dietary.filter(d => d !== diet)
                  : [...filters.dietary, diet]
              })}
              className={`px-3 py-1 rounded text-sm ${
                filters.dietary.includes(diet)
                  ? 'bg-blue-500/20 text-blue-300'
                  : 'bg-gray-700 text-gray-400'
              }`}
            >
              {diet}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function RecipesTab({
  pantryItems,
}: RecipesTabProps) {
  const { 
    recipes,
    isLoading,
    isGenerating,
    fetchRecipes,
  } = useRecipeStore();
  
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [usingRecipe, setUsingRecipe] = useState<Recipe | null>(null);
  const [showElfModal, setShowElfModal] = useState(false);
  const [errorState, setError] = useState<string | null>(null);

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

  const sortedTimestamps = useMemo(() => {
    return Object.keys(groupedRecipes)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .slice(0, 5);
  }, [groupedRecipes]);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        await fetchRecipes();
      } catch (error) {
        console.error('Error fetching recipes:', error);
        if (error instanceof ApiException) {
          if (error.error.status !== 404) {
            setError(error.error.message);
            toast.error('Failed to load recipes');
          }
        } else {
          setError('Failed to load recipes. Please check your connection and try again.');
          toast.error('Failed to load recipes');
        }
      }
    };
    
    loadRecipes();
  }, [fetchRecipes]);

  const handleRemoveRecipe = (recipeId: string) => {
    useRecipeStore.getState().setRecipes((prevRecipes: Recipe[]) => 
      prevRecipes.filter(recipe => recipe.id !== recipeId)
    );
  };

  if (isLoading || isGenerating) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-400">
          {isGenerating ? 'Generating your recipes...' : 'Loading recipes...'}
        </p>
      </div>
    );
  }

  if (errorState && !errorState.includes('404')) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-500/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4">
          {errorState}
        </div>
        <button
          onClick={() => {
            setError(null);
            fetchRecipes();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (recipes.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="bg-gray-800/50 rounded-xl p-8 backdrop-blur-sm max-w-lg mx-auto">
          <h3 className="text-xl font-medium text-white mb-2">No Recipes Yet</h3>
          <p className="text-gray-400">
            Get started by clicking the wand to generate your first batch of AI-powered recipes based on your pantry items.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Generation */}
      {sortedTimestamps[0] && (
        <div>
          <div className="mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium text-gray-400">
                Current Generation
              </h3>
              <span className="text-gray-400">✨</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Recipes tailored to your {pantryItems.length} pantry items
            </p>
          </div>
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
              await useRecipeStore.getState().useRecipe(
                usingRecipe.id, 
                usingRecipe.data.servings, 
                ingredientsUsed
              );
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

      <FloatingElfButton
        onClick={() => setShowElfModal(true)}
        pantryItemsCount={pantryItems.length}
        isGenerating={isGenerating}
      />
    </div>
  );
}
