export interface PantryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string;
  added_date: string;
  notes?: string;
}

export interface PantryItemCreate {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiry_date: string | null;
  notes?: string;
}

export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  preparation_time: string | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  nutritional_info: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  } | null;
  is_saved: boolean;
  meal_category: MealCategory;
  created_at?: string;
  updated_at?: string;
}

interface CategoryRecipeRequest {
  category: MealCategory;
  count: number;
}

export interface RecipeGenerateRequest {
  categories: CategoryRecipeRequest[];
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
