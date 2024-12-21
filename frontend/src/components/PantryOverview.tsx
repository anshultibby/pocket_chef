import { useState } from 'react';
import { PantryItemWithIngredient } from '@/types';

interface PantryOverviewProps {
  pantryItems: PantryItemWithIngredient[];
  onManagePantry: () => void;
}

export default function PantryOverview({ pantryItems, onManagePantry }: PantryOverviewProps) {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <div className="text-center py-8">Loading pantry...</div>;
  }

  // Group items by category
  const groupedItems = pantryItems.reduce((groups, item) => {
    const category = item.data.category || 'Other';
    if (!groups[category]) groups[category] = [];
    groups[category].push(item);
    return groups;
  }, {} as Record<string, PantryItemWithIngredient[]>);

  return (
    <div className="bg-gray-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Your Pantry</h2>
      
      {pantryItems.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p>Your pantry is empty!</p>
          <button 
            className="mt-4 text-blue-400 hover:text-blue-300"
            onClick={onManagePantry}
          >
            Add ingredients
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <h3 className="text-gray-400 text-sm font-medium mb-3">{category}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {items.map(item => (
                  <div 
                    key={item.id}
                    className="bg-gray-800 rounded-lg p-3"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{item.data.display_name}</span>
                      <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                        {item.ingredient.names.canonical}
                      </span>
                    </div>
                    
                    <div className="text-gray-400 text-xs mt-2 space-y-1">
                      <div>
                        {item.data.quantity} {item.data.unit}
                      </div>
                      
                      {item.data.expiry_date && (
                        <div className="text-yellow-500/70">
                          Expires: {new Date(item.data.expiry_date).toLocaleDateString()}
                        </div>
                      )}
                      
                      {item.data.notes && (
                        <div className="text-gray-500 italic">
                          {item.data.notes}
                        </div>
                      )}
                      
                      <div className="text-xs text-gray-500">
                        Per {item.ingredient.measurement.serving_size} {item.ingredient.measurement.standard_unit}:
                        {item.ingredient.nutrition.per_standard_unit.calories} cal
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
