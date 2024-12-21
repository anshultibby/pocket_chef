import { CategoryFiltersProps } from '@/types/pantry';
import { PantryItemWithIngredient } from '@/types';

export default function CategoryFilters({
  categories,
  selectedCategory,
  onSelectCategory,
  pantryItems
}: CategoryFiltersProps) {
  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map((category, index) => (
        <button
          key={`category-button-${category}-${index}`}
          onClick={() => onSelectCategory(
            selectedCategory === category ? null : category
          )}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
            ${selectedCategory === category
              ? 'bg-blue-600/30 text-blue-400 ring-2 ring-blue-500/50'
              : 'bg-gray-800/50 text-gray-400 hover:bg-gray-700/50'
            }`}
        >
          {category}
          <span className="ml-2 bg-gray-700/50 px-2 py-0.5 rounded-full text-xs">
            {pantryItems.filter(item => (item.data.category || 'Other') === category).length}
          </span>
        </button>
      ))}
    </div>
  );
}
