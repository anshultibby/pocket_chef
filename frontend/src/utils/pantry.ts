import { PantryItem } from '@/types';

export const normalizeString = (str: string) => {
    return str.toLowerCase().trim();
  };
  
  export const groupItemsByCategory = (items: PantryItem[]) => {
    return items.reduce((groups, item) => {
      const category = item.data.category || 'Other';
      if (!groups[category]) groups[category] = [];
      groups[category].push(item);
      return groups;
    }, {} as Record<string, PantryItem[]>);
  };
  
  export const findMatchingItem = (
    items: PantryItem[], 
    name: string, 
    unit: string
  ) => {
    return items.find(
      item => 
        normalizeString(item.data.name) === normalizeString(name) &&
        normalizeString(item.data.unit) === normalizeString(unit)
    );
  };