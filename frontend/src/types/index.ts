export type MeasurementUnit = string;
export type DifficultyLevel = 'easy' | 'medium' | 'hard';
export type RecipeType = 'generated' | 'user_created' | 'saved';
export type MealCategory = 'breakfast' | 'lunch' | 'dinner' | 'snack';

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
  category?: string;
  notes?: string;
  expiry_date?: string;
}

export interface PantryItem {
  id: string;
  ingredient_id: string;
  data: PantryItemData;
  user_id: string;
  created_at: string;
  updated_at: string;
}

// Request types
export interface RecipeGenerateRequest {
  categories: Array<{
    category: string;
    count: number;
  }>;
}

export interface PantryItemCreate {
  data: PantryItemData;
}

export interface IngredientMeasurement {
  standard_unit: MeasurementUnit;
  conversion_factor: number;
  serving_size: number;
}

export interface IngredientNames {
  canonical: string;
  aliases: string[];
}

export interface IngredientData {
  names: IngredientNames;
  measurement: IngredientMeasurement;
  nutrition: {
    per_standard_unit: NutritionalInfo;
  };
}

export interface Ingredient {
  id: string;
  data: IngredientData;
  created_at: string;
}

// Add this new interface to match backend
export interface PantryItemUpdate {
  data: Partial<PantryItemData>;
}

export interface PantryItemWithIngredient {
  id: string;
  ingredient_id: string;
  ingredient: IngredientData;
  data: PantryItemData;
  user_id: string;
  created_at: string;
  updated_at: string;
}
