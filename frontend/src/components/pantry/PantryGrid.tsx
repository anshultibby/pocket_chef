import { PantryGridProps } from '@/types/pantry';

export default function PantryGrid({ groupedItems, onSelectItem, onDeleteItem }: PantryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category} className="space-y-4">
          <h3 className="text-lg font-semibold sticky top-0 bg-gray-950 py-2">
            {category}
          </h3>
          <div className="space-y-4">
            {items.map(item => (
              <div 
                key={item.id}
                className="bg-gray-800 rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h3 className="font-medium text-lg">
                      {item.data.standard_name || item.data.name}
                    </h3>
                    {item.data.standard_name && (
                      <p className="text-sm text-gray-400">
                        {item.data.name}
                      </p>
                    )}
                    <p className="text-sm">
                      {item.data.quantity} {item.data.unit}
                    </p>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => onSelectItem(item)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onDeleteItem(item.id)}
                      className="text-red-400 hover:text-red-300"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
