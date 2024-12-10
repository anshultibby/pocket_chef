import { useState, useEffect } from 'react';
import { PantryItem } from '@/types';

interface PantryOverviewProps {
  pantryItems: PantryItem[];
  onManagePantry: () => void;
}

export default function PantryOverview({ pantryItems, onManagePantry }: PantryOverviewProps) {
  const [loading, setLoading] = useState(false);

  if (loading) {
    return <div className="text-center py-8">Loading pantry...</div>;
  }

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
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {pantryItems.map(item => (
            <div 
              key={item.id}
              className="bg-gray-800 rounded-lg p-3 text-sm"
            >
              <span className="font-medium">{item.name}</span>
              <div className="text-gray-400 text-xs mt-1">
                {item.quantity} {item.unit}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
