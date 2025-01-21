import { create } from 'zustand';
import { PantryItem, Recipe, RecipePreferences } from '@/types';
import { recipeApi } from '@/lib/api';
import { pantryStore } from './pantryStore';
import { cache } from '@/lib/cache';

interface RecipeStore {
  // State
  recipes: Recipe[];
  preferences: RecipePreferences;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;

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
  invalidateCache: () => Promise<void>;
}

const CACHE_KEY = 'recipes';
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

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
    num_recipes: 6,
    max_calories: undefined,
    min_protein: undefined
  },
  isLoading: false,
  isGenerating: false,
  error: null,

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
    
    if (state.isLoading) return;

    try {
      set({ isLoading: true, error: null });

      // Check cache first
      const cachedRecipes = await cache.get<Recipe[]>(CACHE_KEY);
      if (cachedRecipes) {
        set({ recipes: cachedRecipes, isLoading: false });
        return;
      }

      // Fetch fresh data
      const recipes = await recipeApi.getAll();
      
      // Cache the result
      await cache.set(CACHE_KEY, recipes, CACHE_TTL);
      
      set({ recipes, isLoading: false });
    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Failed to load recipes';
      set({ error: errorMessage, isLoading: false });
      console.error('Recipe fetch error:', error);
    }
  },

  invalidateCache: async () => {
    await cache.delete(CACHE_KEY);
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
