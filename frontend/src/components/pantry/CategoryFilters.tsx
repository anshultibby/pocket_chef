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

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map((category, index) => {
          const categoryLabel = getCategoryLabel(category);
          return (
            <button
              key={`category-button-${category}-${index}`}
              onClick={() => onSelectCategory(category.toLowerCase())}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
                ${selectedCategories.includes(category.toLowerCase())
                  ? 'bg-blue-600/30 text-blue-400 ring-2 ring-blue-500/50'
                  : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
                }`}
            >
              {categoryLabel}
              <span className="ml-2 bg-gray-700/50 px-2 py-0.5 rounded-full text-xs">
                {items.filter(item => (item.data.category || CATEGORIES.OTHER).toLowerCase() === category.toLowerCase()).length}
              </span>
            </button>
          );
        })}
      </div>
      
      {selectedCategories.length > 0 && (
        <button
          onClick={onClearCategories}
          className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          Clear Filters ({selectedCategories.length})
        </button>
      )}
    </div>
  );
});

export default CategoryFilters;
