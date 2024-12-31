import { useState, useEffect } from 'react';
import { Recipe, PantryItem } from '@/types';
import { useRecipeStore } from '@/stores/recipeStore';
import { useMealPlanStore } from '@/stores/mealPlanStore';
import { toast } from 'react-hot-toast';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import RecipeDetailModal from './recipes/RecipeDetailModal';
import RecipeUseModal from './recipes/use-recipe/RecipeUseModal';
import { FloatingElfButton } from './FloatingElfButton';
import ElfModal from './modals/ElfModal';
import { CurrentMealPlan } from './meal-plan/CurrentMealPlan';
import { RecipeSuggestions } from './meal-plan/RecipeSuggestions';

interface MealPlanTabProps {
  pantryItems: PantryItem[];
  loading: boolean;
}

export default function MealPlanTab({ pantryItems, loading }: MealPlanTabProps) {
  const { recipes, fetchRecipes } = useRecipeStore();
  const { mealPlan, isGenerating, addToMealPlan, removeFromMealPlan } = useMealPlanStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [usingRecipe, setUsingRecipe] = useState<Recipe | null>(null);
  const [showElfModal, setShowElfModal] = useState(false);

  useEffect(() => {
    const loadRecipes = async () => {
      try {
        await fetchRecipes();
      } catch (error) {
        console.error('Error fetching recipes:', error);
        toast.error('Failed to load recipes');
      }
    };
    
    loadRecipes();
  }, [fetchRecipes]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || over.id !== 'meal-plan') return;

    const recipeId = active.id.toString();
    const recipe = recipes.find(r => r.id === recipeId);
    
    if (!recipe || mealPlan.current?.some(r => r.id === recipeId)) return;

    addToMealPlan('current', recipe);
    toast.success(`Added ${recipe.data.name} to meal plan`);
  };

  const handleRemoveRecipe = (recipe: Recipe) => {
    removeFromMealPlan('current', recipe.id);
    toast.success(`Removed ${recipe.data.name} from meal plan`);
  };

  if (loading || isGenerating) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
        <p className="text-gray-400">
          {isGenerating ? 'Generating meal suggestions...' : 'Loading...'}
        </p>
      </div>
    );
  }

  return (
    <DndContext 
      onDragEnd={handleDragEnd}
      collisionDetection={closestCenter}
    >
      <div className="space-y-8">
        <CurrentMealPlan 
          onSelectRecipe={setSelectedRecipe}
          pantryItems={pantryItems}
        />

        <RecipeSuggestions
          recipes={recipes}
          pantryItems={pantryItems}
          onSelectRecipe={setSelectedRecipe}
        />

        {selectedRecipe && (
          <RecipeDetailModal
            recipe={selectedRecipe}
            onClose={() => setSelectedRecipe(null)}
            onUse={() => {
              setUsingRecipe(selectedRecipe);
              setSelectedRecipe(null);
            }}
            onRemove={() => {
              handleRemoveRecipe(selectedRecipe);
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
                toast.success('Recipe used successfully!');
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
    </DndContext>
  );
}
