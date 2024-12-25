import { useMemo } from 'react';
import { usePantryStore } from './pantryStore';
import { useUIStore } from './uiStore';

export const usePantryItems = () => {
  const items = usePantryStore(state => state.items);
  const searchTerm = useUIStore(state => state.searchTerm);
  const selectedCategories = useUIStore(state => state.selectedCategories);

  return useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.data.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategories.length === 0 || 
        selectedCategories.includes(item.data.category || 'Other');
      return matchesSearch && matchesCategory;
    });
  }, [items, searchTerm, selectedCategories]);
};
