import { create } from 'zustand';
import { Recipe, RecipePreferences } from '@/types';

interface RecipeStore {
  recipes: Recipe[];
  preferences: RecipePreferences;
  isLoading: boolean;
  isGenerating: boolean;
  error: string | null;
  setRecipes: (recipes: Recipe[]) => void;
  setPreferences: (preferences: Partial<RecipePreferences>) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsGenerating: (isGenerating: boolean) => void;
  setError: (error: string | null) => void;
  clearRecipes: () => void;
}

export const useRecipeStore = create<RecipeStore>((set) => ({
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
  setRecipes: (recipes) => set({ recipes }),
  setPreferences: (preferences) => set((state) => ({ 
    preferences: { ...state.preferences, ...preferences } 
  })),
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setError: (error) => set({ error }),
  clearRecipes: () => set({ recipes: [] })
}));
