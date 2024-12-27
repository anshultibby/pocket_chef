import { CategoryFiltersProps } from '@/types/pantry';
import { usePantryStore } from '@/stores/pantryStore';
import { memo } from 'react';
import { getCategoryLabel } from '@/constants/categories';
import { CATEGORIES } from '@/constants/categories';

const CategoryFilters = memo(function CategoryFilters({
  categories,
  selectedCategories,
  onSelectCategory,
  onClearCategories,
}: CategoryFiltersProps) {
  const { items } = usePantryStore();
  
  // Sort categories by item count
  const sortedCategories = [...categories].sort((a, b) => {
    const countA = items.filter(item => (item.data.category || CATEGORIES.OTHER).toLowerCase() === a.toLowerCase()).length;
    const countB = items.filter(item => (item.data.category || CATEGORIES.OTHER).toLowerCase() === b.toLowerCase()).length;
    return countB - countA;
  });

  // Split into main categories (top 5) and others
  const mainCategories = sortedCategories.slice(0, 5);
  const otherCategories = sortedCategories.slice(5);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Main category buttons */}
      {mainCategories.map((category) => (
        <button
          key={category}
          onClick={() => onSelectCategory(category.toLowerCase())}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
            ${selectedCategories.includes(category.toLowerCase())
              ? 'bg-blue-600/30 text-blue-400 ring-1 ring-blue-500/50'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
        >
          {getCategoryLabel(category)}
          <span className="ml-1.5 text-xs opacity-60">
            {items.filter(item => (item.data.category || CATEGORIES.OTHER).toLowerCase() === category.toLowerCase()).length}
          </span>
        </button>
      ))}

      {/* Dropdown for additional categories */}
      {otherCategories.length > 0 && (
        <div className="relative">
          <select
            onChange={(e) => onSelectCategory(e.target.value)}
            className="bg-gray-800 text-gray-400 px-3 py-1.5 rounded-lg text-sm appearance-none cursor-pointer hover:bg-gray-700"
          >
            <option value="">More categories...</option>
            {otherCategories.map((category) => (
              <option key={category} value={category.toLowerCase()}>
                {getCategoryLabel(category)}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCategories.length > 0 && (
        <button
          onClick={onClearCategories}
          className="text-sm text-gray-400 hover:text-gray-300 px-2 py-1"
        >
          Clear ({selectedCategories.length})
        </button>
      )}
    </div>
  );
});

export default CategoryFilters;
