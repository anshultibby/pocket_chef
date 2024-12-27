import { PantryGridProps } from '@/types/pantry';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { usePantryStore } from '@/stores/pantryStore';

export default function PantryGrid({ groupedItems, onSelectItem }: Omit<PantryGridProps, 'onDeleteItem'>) {
  const { deleteItem } = usePantryStore();
  
  return (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold text-gray-200 mb-4">
            {category}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map(item => (
              <div 
                key={item.id}
                className="bg-gray-800/50 rounded-lg p-4 group hover:bg-gray-700/80 transition-all relative border border-gray-700/50"
              >
                <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectItem(item);
                    }}
                    className="p-1.5 bg-gray-700/50 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteItem(item.id);
                    }}
                    className="p-1.5 bg-gray-700/50 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <h4 className="text-lg font-medium text-white leading-tight">
                      {item.data.name}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-base text-gray-300">
                        {item.data.quantity} {item.data.unit}
                      </span>
                      {item.data.expiry_date && (
                        <span className="text-sm text-gray-500">
                          Expires: {new Date(item.data.expiry_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {item.data.notes && (
                    <p className="text-sm text-gray-400 italic">
                      {item.data.notes}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
