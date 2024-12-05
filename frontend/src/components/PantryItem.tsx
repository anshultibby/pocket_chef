import { PantryItem as PantryItemType } from '@/types';

interface PantryItemProps {
  item: PantryItemType;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<PantryItemType>) => void;
}

export default function PantryItem({ item, onDelete, onUpdate }: PantryItemProps) {
  return (
    <div className="border rounded-lg p-4 bg-white shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">{item.name}</h3>
          <div className="text-sm text-gray-600">
            <p>{item.quantity} {item.unit}</p>
            {item.category && <p>Category: {item.category}</p>}
            {item.expiryDate && (
              <p>Expires: {new Date(item.expiryDate).toLocaleDateString()}</p>
            )}
          </div>
        </div>
        <div className="space-x-2">
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-500 hover:text-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => {
              const newQuantity = prompt('Enter new quantity:', item.quantity.toString());
              if (newQuantity) {
                onUpdate(item.id, { quantity: parseFloat(newQuantity) });
              }
            }}
            className="text-blue-500 hover:text-blue-700"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
