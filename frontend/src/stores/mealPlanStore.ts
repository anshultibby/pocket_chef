import { create } from 'zustand';
import { Recipe } from '@/types';

type MealPlanKey = 'current';

interface MealPlanStore {
  mealPlan: {
    current: Recipe[];
  };
  isGenerating: boolean;
  setIsGenerating: (isGenerating: boolean) => void;
  addToMealPlan: (key: MealPlanKey, recipe: Recipe) => void;
  removeFromMealPlan: (key: MealPlanKey, recipeId: string) => void;
}

export const useMealPlanStore = create<MealPlanStore>((set) => ({
  mealPlan: {
    current: []
  },
  isGenerating: false,
  
  setIsGenerating: (isGenerating: boolean) => {
    set({ isGenerating });
  },
  
  addToMealPlan: (key: MealPlanKey, recipe: Recipe) => {
    set((state) => ({
      mealPlan: {
        ...state.mealPlan,
        current: key === 'current' 
          ? [...state.mealPlan.current, recipe]
          : state.mealPlan.current
      },
    }));
  },
  
  removeFromMealPlan: (key: MealPlanKey, recipeId: string) => {
    set((state) => ({
      mealPlan: {
        ...state.mealPlan,
        current: key === 'current'
          ? state.mealPlan.current.filter((r) => r.id !== recipeId)
          : state.mealPlan.current
      },
    }));
  },
}));
