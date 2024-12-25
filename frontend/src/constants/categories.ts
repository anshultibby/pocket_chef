export const CATEGORIES = {
  PRODUCE: 'produce',
  DAIRY: 'dairy & eggs',
  MEAT: 'meat & seafood',
  PANTRY: 'pantry',
  FROZEN: 'frozen',
  BEVERAGES: 'beverages',
  SNACKS: 'snacks',
  BAKING: 'baking',
  CONDIMENTS: 'condiments',
  SPICES: 'spices & seasonings',
  OTHER: 'other'
} as const;

export const CATEGORY_LABELS = {
  [CATEGORIES.PRODUCE]: 'Produce',
  [CATEGORIES.DAIRY]: 'Dairy & Eggs',
  [CATEGORIES.MEAT]: 'Meat & Seafood',
  [CATEGORIES.PANTRY]: 'Pantry',
  [CATEGORIES.FROZEN]: 'Frozen',
  [CATEGORIES.BEVERAGES]: 'Beverages',
  [CATEGORIES.SNACKS]: 'Snacks',
  [CATEGORIES.BAKING]: 'Baking',
  [CATEGORIES.CONDIMENTS]: 'Condiments',
  [CATEGORIES.SPICES]: 'Spices & Seasonings',
  [CATEGORIES.OTHER]: 'Other'
} as const;

export const SUGGESTED_CATEGORIES = Object.values(CATEGORY_LABELS);

export const getCategoryLabel = (category: string | undefined): string => {
  if (!category) return CATEGORY_LABELS[CATEGORIES.OTHER];
  // Just capitalize the first letter of each word
  return category
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};
