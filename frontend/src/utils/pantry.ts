import { PantryItem } from '@/types';

export const normalizeString = (str: string | undefined | null) => {
  if (!str) return '';
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
  const normalizedName = normalizeString(name);
  return items.find(item => 
    normalizeString(item.data.name) === normalizedName &&
    normalizeString(item.data.unit) === normalizeString(unit)
  );
};