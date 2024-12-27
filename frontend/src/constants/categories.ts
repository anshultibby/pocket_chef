export const CATEGORIES = {
  OTHER: 'other'
} as const;

export const CATEGORY_LABELS = {
  [CATEGORIES.OTHER]: 'Other'
} as const;

export const getCategoryLabel = (category: string | undefined): string => {
  if (!category) return CATEGORY_LABELS[CATEGORIES.OTHER];
  // Just capitalize the first letter of each word
  return category
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};


