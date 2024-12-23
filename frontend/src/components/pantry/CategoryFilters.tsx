import { CategoryFiltersProps } from '@/types/pantry';

export default function CategoryFilters({
  categories,
  selectedCategories,
  onSelectCategory,
  onClearCategories,
  pantryItems
}: CategoryFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {categories.map((category, index) => (
          <button
            key={`category-button-${category}-${index}`}
            onClick={() => onSelectCategory(category)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
              ${selectedCategories.includes(category)
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
}
