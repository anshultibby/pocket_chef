import { PantryItem } from '@/types';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { useDraggable } from '@dnd-kit/core';

interface PantryItemCardProps {
  item: PantryItem;
  onSelect: (item: PantryItem) => void;
  onDelete: (id: string) => void;
}

export function PantryItemCard({ item, onSelect, onDelete }: PantryItemCardProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    transition: 'none',
    touchAction: 'none',
    zIndex: 100,
  } : undefined;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="bg-gray-800/50 rounded-lg p-2 group hover:bg-gray-700/80 relative border border-gray-700/50 will-change-transform active:bg-gray-700/80"
    >
      <div className="absolute top-2.5 right-2.5 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-active:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-0.5 rounded-lg text-gray-400 hover:text-red-400"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div 
        onClick={() => onSelect(item)}
        className="cursor-pointer"
      >
        <div className="space-y-1">
          <div>
            <h4 className="text-base font-medium text-white leading-tight">
              {item.data.name}
            </h4>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-sm text-gray-300">
                {item.data.quantity} {item.data.unit}
              </span>
              {item.data.expiry_date && (
                <span className="text-xs text-gray-500">
                  Expires: {new Date(item.data.expiry_date).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
          
          {item.data.notes && (
            <p className="text-xs text-gray-400 italic">
              {item.data.notes}
            </p>
          )}
        </div>
      </div>

      <div 
        {...listeners} 
        className="absolute bottom-3 right-3 cursor-move opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-active:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4 text-gray-400 hover:text-gray-300" viewBox="0 0 20 20">
          <path 
            fill="currentColor" 
            d="M7 2a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 8a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM7 14a2 2 0 1 1 0 4 2 2 0 0 1 0-4zm6 0a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"
          />
        </svg>
      </div>
    </div>
  );
}
