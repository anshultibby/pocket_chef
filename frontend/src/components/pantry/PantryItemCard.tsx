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
      className="bg-gray-800/50 rounded-lg p-4 group hover:bg-gray-700/80 relative border border-gray-700/50 will-change-transform"
    >
      <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(item);
          }}
          className="p-1.5 bg-gray-700/50 rounded-lg text-gray-400 hover:text-blue-400 hover:bg-blue-500/10"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="p-1.5 bg-gray-700/50 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>

      <div {...listeners} className="cursor-move">
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
    </div>
  );
}
