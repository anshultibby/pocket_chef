import { create } from 'zustand';
import { Recipe, RecipePreferences, PantryItem } from '@/types';
import { recipeApi } from '@/lib/api';
import { IngredientUpdate } from '@/components/recipes/use-recipe/types';
import { roundQuantity } from './pantryStore';

interface RecipeUseState {
  recipe: Recipe | null;
  servings: number;
  step: 'review' | 'confirm';
  isConfirming: boolean;
  finalQuantities: Map<string, IngredientUpdate>;
}

interface RecipeStore {
  recipes: Recipe[];
  preferences: RecipePreferences;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  selectedRecipe: Recipe | null;
  usingRecipe: RecipeUseState | null;

  // Sync actions
  setRecipes: (recipes: Recipe[]) => void;
  setPreferences: (preferences: Partial<RecipePreferences>) => void;
  setError: (error: string | null) => void;
  setSelectedRecipe: (recipe: Recipe | null) => void;
  setUsingRecipe: (recipe: Recipe | null) => void;
  
  // Recipe use actions
  initializeUseRecipe: (recipe: Recipe, pantryItems: PantryItem[]) => void;
  setServings: (servings: number) => void;
  setUseStep: (step: 'review' | 'confirm') => void;
  updateEditedItem: (values: PantryItem) => void;
  closeUseRecipe: () => void;

  // Async actions
  generateRecipes: () => Promise<void>;
  useRecipe: (onConfirmUse: (updates: Record<string, number>) => Promise<void>) => Promise<void>;

  // Add these new actions
  setIsLoading: (isLoading: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
}

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  recipes: [],
  preferences: {
    cuisine: [],
    max_prep_time: undefined,
    dietary: [],
    serving_size: 2,
    meal_types: [],
    nutrition_goals: [],
    custom_preferences: '',
    recipes_per_meal: 3
  },
  isLoading: false,
  isGenerating: false,
  error: null,
  selectedRecipe: null,
  usingRecipe: null,

  // Sync actions
  setRecipes: (recipes) => set({ recipes }),
  setPreferences: (preferences) => set((state) => ({ 
    preferences: { ...state.preferences, ...preferences } 
  })),
  setError: (error) => set({ error }),
  setSelectedRecipe: (recipe) => set({ selectedRecipe: recipe }),
  setUsingRecipe: (recipe) => set({ 
    usingRecipe: recipe ? {
      recipe,
      step: 'review',
      servings: recipe.data.servings,
      finalQuantities: new Map(),
      isConfirming: false
    } : null 
  }),
  
  // Recipe use actions
  initializeUseRecipe: (recipe, pantryItems) => {
    const finalQuantities = calculateFinalQuantities(recipe, pantryItems, recipe.data.servings);
    set({ 
      usingRecipe: {
        recipe,
        servings: recipe.data.servings,
        step: 'review',
        isConfirming: false,
        finalQuantities
      }
    });
  },

  setServings: (servings) => {
    const { usingRecipe } = get();
    if (!usingRecipe?.recipe) return;
    
    const finalQuantities = calculateFinalQuantities(
      usingRecipe.recipe,
      Array.from(usingRecipe.finalQuantities.values()),
      servings
    );
    
    set({ 
      usingRecipe: { 
        ...usingRecipe, 
        servings,
        finalQuantities
      }
    });
  },

  setUseStep: (step) => {
    const { usingRecipe } = get();
    if (!usingRecipe) return;
    set({ usingRecipe: { ...usingRecipe, step } });
  },

  updateEditedItem: (values) => {
    const { usingRecipe } = get();
    if (!usingRecipe?.recipe) return;

    const updatedQuantities = new Map(usingRecipe.finalQuantities);
    const currentItem = updatedQuantities.get(usingRecipe.recipe.id);
    
    if (currentItem) {
      const recipeIngredient = usingRecipe.recipe.data.ingredients.find(
        ing => ing.name.toLowerCase() === values.data.name.toLowerCase()
      );
      
      const exactMatch = recipeIngredient ? values.data.unit === recipeIngredient.unit : false;
      const userConverted = !exactMatch && 
        values.data.quantity !== currentItem.data.quantity &&
        values.data.unit === currentItem.data.unit;

      const updatedItem = {
        ...currentItem,
        data: values.data,
        nutrition: values.nutrition,
        matches: exactMatch || userConverted,
        initial: currentItem.data.quantity ?? 0,
        final: values.data.quantity ?? 0
      };

      set({ 
        usingRecipe: { 
          ...usingRecipe, 
          finalQuantities: new Map(updatedQuantities.set(usingRecipe.recipe.id, updatedItem)),
        } 
      });
    }
  },

  closeUseRecipe: () => set({ usingRecipe: null }),

  // Async actions
  generateRecipes: async () => {
    const { preferences } = get();
    set({ isLoading: true, isGenerating: true, error: null });
    try {
      const recipes = await recipeApi.generate(preferences);
      set({ recipes, isLoading: false, isGenerating: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to generate recipes',
        isLoading: false,
        isGenerating: false
      });
    }
  },

  useRecipe: async (onConfirmUse) => {
    const { usingRecipe } = get();
    if (!usingRecipe) return;

    set({ usingRecipe: { ...usingRecipe, isConfirming: true } });
    
    try {
      const updates = Object.fromEntries(
        Array.from(usingRecipe.finalQuantities).map(([key, value]) => [
          key,
          roundQuantity(value.initial - value.final)
        ])
      );
      
      await onConfirmUse(updates);
      set({ usingRecipe: null });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to use recipe',
        usingRecipe: { ...usingRecipe, isConfirming: false }
      });
      throw error;
    }
  },

  // Add these new actions
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsGenerating: (isGenerating) => set({ isGenerating })
}));

function calculateFinalQuantities(
  recipe: Recipe, 
  pantryItems: PantryItem[], 
  servings: number
): Map<string, IngredientUpdate> {
  const finalQuantities = new Map<string, IngredientUpdate>();
  const scalingFactor = servings / recipe.data.servings;
  
  recipe.data.ingredients.forEach((ing) => {
    const matchingPantryItem = pantryItems.find(
      (item) => item.data.name.toLowerCase() === ing.name.toLowerCase()
    );

    if (matchingPantryItem) {
      const matches = matchingPantryItem.data.unit === ing.unit;
      const scaledQuantity = ing.quantity * scalingFactor;
      
      finalQuantities.set(matchingPantryItem.id, {
        ...matchingPantryItem,
        initial: matchingPantryItem.data.quantity ?? 0,
        final: matches 
          ? Math.max(0, (matchingPantryItem.data.quantity ?? 0) - scaledQuantity) 
          : matchingPantryItem.data.quantity ?? 0,
        matches
      });
    }
  });
  
  return finalQuantities;
}
