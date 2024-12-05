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

export interface Recipe {
  id: string;
  name: string;
  ingredients: string[];
  instructions: string[];
  cooking_time?: number;
  servings?: number;
  is_saved?: boolean;
}

export interface RecipeGenerateRequest {
  ingredients: string[];
  preferences?: {
    dietary?: string[];
    cuisine?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
  };
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}
