import { PantryItemCreate } from '@/types';
import { IngredientUpdate } from './types';

interface IngredientCardProps {
  id: string;
  item: IngredientUpdate;
  onEdit: (data: { id: string; item: PantryItemCreate }) => void;
}

export function IngredientCard({ id, item, onEdit }: IngredientCardProps) {
  const handleEdit = () => {
    const pantryItemData: PantryItemCreate = {
      data: {
        ...item.data,
        quantity: item.initial,
      },
      nutrition: item.nutrition
    };
    
    onEdit({ id, item: pantryItemData });
  };

  return (
    <div 
      className={`p-4 rounded-lg cursor-pointer ${
        !item.matches ? 'bg-yellow-500/20' : 
        item.final === 0 ? 'bg-red-500/20' : 
        'bg-gray-800'
      } hover:bg-opacity-80 transition-colors`}
      onClick={handleEdit}
    >
      <div className="font-medium text-white">{item.data.name}</div>
      <div className="text-sm mt-1 space-y-1">
        {item.data.category && (
          <div className="text-gray-400">Category: {item.data.category}</div>
        )}
        <div className="text-gray-400">
          Current: {item.initial.toFixed(1)} {item.data.unit}
        </div>
        {item.matches ? (
          <>
            <div className="text-gray-400">
              Using: {(item.initial - item.final).toFixed(1)} {item.data.unit}
            </div>
            <div className={`${
              item.final === 0 ? 'text-red-400' : 'text-green-400'
            }`}>
              Remaining: {item.final.toFixed(1)} {item.data.unit}
              {item.final === 0 && ' (Will be removed)'}
            </div>
          </>
        ) : (
          <div className="text-yellow-400">
            Units don't match recipe requirements. Click to edit.
          </div>
        )}
        {item.data.notes && (
          <div className="text-gray-400 italic">Note: {item.data.notes}</div>
        )}
      </div>
    </div>
  );
}
