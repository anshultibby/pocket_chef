export const DIETARY_PREFERENCES = [
    'Vegetarian',
    'Vegan',
    'Pescatarian',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Paleo',
    'Low-Carb',
    'Low-Fat',
    'Mediterranean',
    'Halal',
    'Kosher'
  ] as const;
  
  export const USER_GOALS = [
    'Save Money',
    'Meal Planning',
    'Track Nutrition',
    'Learn Cooking',
    'Eat Healthier',
    'Reduce Food Waste',
    'Cook More Often',
    'Try New Recipes',
    'Weight Management',
    'Family Meals'
  ] as const;

export const COOKING_EXPERIENCE = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced'
} as const;

export const COOKING_EXPERIENCE_LABELS = {
  [COOKING_EXPERIENCE.BEGINNER]: 'Beginner',
  [COOKING_EXPERIENCE.INTERMEDIATE]: 'Intermediate',
  [COOKING_EXPERIENCE.ADVANCED]: 'Advanced'
} as const;

export const DEFAULT_SERVINGS_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12];