import { PantryItemWithIngredient } from '@/types';

export const normalizeString = (str: string) => {
    return str.toLowerCase().trim();
  };
  
  export const groupItemsByCategory = (items: PantryItemWithIngredient[]) => {
    return items.reduce((groups, item) => {
      const category = item.data.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {} as Record<string, PantryItemWithIngredient[]>);
  };
  
  export const findMatchingItem = (
    items: PantryItemWithIngredient[], 
    displayName: string, 
    unit: string
  ) => {
    return items.find(
      item => 
        normalizeString(item.data.display_name) === normalizeString(displayName) &&
        normalizeString(item.data.unit) === normalizeString(unit)
    );
  };