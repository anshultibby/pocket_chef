import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { PantryItem, Recipe, RecipePreferences } from '@/types';
import { recipeApi } from '@/lib/api';
import { pantryStore } from './pantryStore';

interface RecipeStore {
  // State
  recipes: Recipe[];
  preferences: RecipePreferences;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  lastFetched: number | null;

  // Actions
  setRecipes: (recipes: Recipe[] | ((prevRecipes: Recipe[]) => Recipe[])) => void;
  setPreferences: (preferences: Partial<RecipePreferences>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearRecipes: () => void;
  
  // Async actions
  fetchRecipes: () => Promise<void>;
  useRecipe: (
    recipeId: string, 
    servingsMade: number, 
    ingredientsUsed: Record<string, number>
  ) => Promise<void>;
}

const FETCH_COOLDOWN = 5 * 60 * 1000; // 5 minutes

export const useRecipeStore = create<RecipeStore>((set, get) => ({
  // Initial state
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
  lastFetched: null,

  // Actions
  setRecipes: (recipesOrUpdater) => set((state) => ({
    recipes: typeof recipesOrUpdater === 'function' 
      ? recipesOrUpdater(state.recipes)
      : recipesOrUpdater
  })),
  setPreferences: (preferences) => set((state) => ({ 
    preferences: { ...state.preferences, ...preferences } 
  })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  clearRecipes: () => set({ recipes: [] }),

  // Async actions
  fetchRecipes: async () => {
    const state = get();
    
    // Don't fetch if already loading
    if (state.isLoading) return;
    
    // Don't fetch if within cooldown period
    const now = Date.now();
    if (state.lastFetched && (now - state.lastFetched) < FETCH_COOLDOWN) {
      return;
    }

    try {
      set({ isLoading: true, error: null });
      const recipes = await recipeApi.getAll();
      set({ 
        recipes,
        lastFetched: now,
        error: null 
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recipes';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  useRecipe: async (recipeId, servingsMade, ingredientsUsed) => {
    try {
      await recipeApi.use(recipeId, {
        servings_made: servingsMade,
        ingredients_used: ingredientsUsed,
      });
      
      // Refresh pantry items using the store instance
      await pantryStore.getState().fetchItems();
      
    } catch (error) {
      console.error('Error using recipe:', error);
      throw error;
    }
  },
}));

export const calculateRecipeAvailability = (recipe: Recipe, pantryItems: PantryItem[]) => {
  const total = recipe.data.ingredients.length;
  if (total === 0) return { percentage: 0, available: 0, total };
  
  const available = recipe.data.ingredients.filter(ing => {
    const matchingPantryItem = pantryItems.find(item => 
      item.data.name && 
      item.data.name.toLowerCase() === ing.name.toLowerCase()
    );
    return matchingPantryItem !== undefined;
  }).length;
  
  return {
    percentage: Math.round((available / total) * 100),
    available,
    total
  };
};

export const getIngredientStatus = (
  ingredient: Recipe['data']['ingredients'][0], 
  pantryItems: PantryItem[]
) => {
  const matchingItem = pantryItems.find(item => 
    item.data.name && 
    item.data.name.toLowerCase() === ingredient.name.toLowerCase() &&
    item.data.unit === ingredient.unit &&
    item.data.quantity >= ingredient.quantity
  );

  if (matchingItem) return 'text-green-400';
  if (ingredient.substitutes?.length) return 'text-yellow-400';
  return 'text-red-400';
};
