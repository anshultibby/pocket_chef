import { PantryGridProps } from '@/types/pantry';
import { usePantryStore } from '@/stores/pantryStore';
import { PantryItemCard } from './PantryItemCard';
import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { pantryApi } from '@/lib/api';

function CategoryDropZone({ category, children }: { category: string; children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({
    id: category,
  });

  return (
    <div ref={setNodeRef} className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-200 mb-4">
        {category}
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {children}
      </div>
    </div>
  );
}

export default function PantryGrid({ groupedItems, onSelectItem }: Omit<PantryGridProps, 'onDeleteItem'>) {
  const { deleteItem, updateItem } = usePantryStore();

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current) {
      const newCategory = over.id as string;
      const item = active.data.current;
      
      if (item.data.category !== newCategory) {
        // Immediately update UI for snappy feedback
        updateItem(active.id as string, {
          data: {
            ...item.data,
            category: newCategory
          }
        });

        try {
          // Then update backend
          await pantryApi.updateItem(active.id as string, {
            data: {
              ...item.data,
              category: newCategory
            }
          });
        } catch (error) {
          console.error('Failed to update item category:', error);
          // Revert the UI change on error
          updateItem(active.id as string, {
            data: {
              ...item.data,
              category: item.data.category // Revert to original category
            }
          });
          // Optionally show an error toast here
        }
      }
    }
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-8">
        {Object.entries(groupedItems).map(([category, items]) => (
          <CategoryDropZone key={category} category={category}>
            {items.map(item => (
              <PantryItemCard
                key={item.id}
                item={item}
                onSelect={onSelectItem}
                onDelete={deleteItem}
              />
            ))}
          </CategoryDropZone>
        ))}
      </div>
    </DndContext>
  );
}
