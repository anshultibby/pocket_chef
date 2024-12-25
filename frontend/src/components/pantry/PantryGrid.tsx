import { PantryGridProps } from '@/types/pantry';
import { TrashIcon } from '@heroicons/react/24/outline';
import { groupItemsByCategory } from '@/utils/pantry';

export default function PantryGrid({ items, onSelectItem, onDeleteItem }: PantryGridProps) {
  const groupedItems = groupItemsByCategory(items);
  
  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    onDeleteItem(id);
  };
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Object.entries(groupedItems).map(([category, categoryItems]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold sticky top-0 bg-gray-950 py-2">
            {category}
          </h3>
          <div className="space-y-4">
            {categoryItems.map(item => (
              <div 
                key={item.id}
                className="bg-gray-800 rounded-lg p-4 space-y-2 group hover:bg-gray-700/80 transition-colors cursor-pointer relative"
                onClick={() => onSelectItem(item)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg">
                      {item.data.name}
                    </h3>
                    <p className="text-sm">
                      {item.data.quantity} {item.data.unit}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, item.id)}
                    className="text-red-400 hover:text-red-300 p-2 opacity-0 group-hover:opacity-100 transition-opacity absolute top-2 right-2"
                    title="Delete item"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
