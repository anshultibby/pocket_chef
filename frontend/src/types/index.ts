export type MeasurementUnit = 'grams' | 'milliliters' | 'units' | 'pinch';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type RecipeType = 'generated' | 'user_created' | 'saved';

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
}

export interface RecipeIngredient {
  ingredient_id: string;
  quantity: number;
  unit: MeasurementUnit;
  notes?: string;
}

export interface RecipeData {
  name: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  preparation_time: number;
  difficulty: DifficultyLevel;
  calculated_nutrition: {
    total: NutritionalInfo;
    per_serving: NutritionalInfo;
  };
  servings: number;
  category: string;
}

export interface Recipe {
  id: string;
  data: RecipeData;
  recipe_type: RecipeType;
  is_public: boolean;
  original_recipe_id?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Pantry types matching the database
export interface PantryItemData {
  display_name: string;
  quantity: number;
  unit: MeasurementUnit;
  notes?: string;
}

export interface PantryItem {
  id: string;
  ingredient_id: string;
  data: PantryItemData;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

// Request types
export interface RecipeGenerateRequest {
  categories: Array<{
    category: string;
    count: number;
  }>;
}

export interface PantryItemCreate {
  ingredient_id: string;
  data: PantryItemData;
  expiry_date?: string;
}
