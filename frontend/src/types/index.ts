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
  name: string;
  quantity: number;
  unit: string;
  pantry_item_id?: string;
  is_optional: boolean;
  substitutes: string[];
}

export interface RecipeData {
  name: string;
  ingredients: RecipeIngredient[];
  instructions: string[];
  preparation_time: number;
  servings: number;
  category: string;
}

export interface Recipe {
  id: string;
  data: RecipeData;
  created_at: string;
  updated_at: string;
  is_saved: boolean;
}

// Pantry types matching the database
export interface PantryItemData {
  name: string;
  quantity: number;
  unit: string;
  standard_name?: string;
  category?: string;
  notes?: string;
  expiry_date?: string | null;
  price?: number | null;
}

export interface Nutrition {
  standard_unit?: string;
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
}

export interface PantryItemCreate {
  data: PantryItemData;
  nutrition: Partial<Nutrition>;
}

export interface PantryItemUpdate {
  data?: Partial<PantryItemData>;
  nutrition?: Partial<Nutrition>;
}

export interface PantryItem {
  id: string;
  data: PantryItemData;
  nutrition: Nutrition;
  user_id: string;
  created_at: string;
  updated_at: string;
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

export interface RecipeCreate {
  data: RecipeData;
  is_public: boolean;
}

export interface CategoryRequest {
  category: string;
  count: number;
}

export interface RecipeGenerateRequest {
  categories: CategoryRequest[];
}

export interface RecipePreferences {
  cuisine: string[];
  max_prep_time?: number;
  meal_types: string[];
  dietary: string[];
  nutrition_goals: string[];
  serving_size: number;
  recipes_per_meal: number;
  custom_preferences?: string;
}