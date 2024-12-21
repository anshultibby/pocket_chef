import { PantryGridProps } from '@/types/pantry';

export default function PantryGrid({ groupedItems, onSelectItem, onDeleteItem }: PantryGridProps) {
  return (
    <div className="space-y-8">
      {Object.entries(groupedItems).map(([category, items]) => (
        <div key={category}>
          <h3 className="text-lg font-semibold mb-4">{category}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map(item => (
              <div 
                key={item.id}
                className="bg-gray-800 rounded-lg p-4 space-y-2"
              >
                <div className="flex justify-between items-start">
                  <h4 className="font-medium">{item.data.display_name}</h4>
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
                <div className="text-sm text-gray-400">
                  {item.data.quantity} {item.data.unit}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
