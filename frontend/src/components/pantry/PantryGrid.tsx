import { PantryGridProps } from '@/types/pantry';
import { usePantryStore } from '@/stores/pantryStore';
import { PantryItemCard } from './PantryItemCard';
import { DndContext, DragEndEvent, useDroppable } from '@dnd-kit/core';
import { pantryApi } from '@/lib/api';
import { useState } from 'react';

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
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());
  
  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

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
        }
      }
    }
  };

  // Sort the categories alphabetically
  const sortedEntries = Object.entries(groupedItems).sort(([a], [b]) => 
    a.localeCompare(b)
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-3">
        {sortedEntries.map(([category, items]) => (
          <div key={category} className="space-y-1">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between p-1.5 hover:bg-gray-800/50 rounded-lg transition-colors"
            >
              <h3 className="text-lg font-medium text-white">{category}</h3>
              <span className="text-gray-400">
                {collapsedCategories.has(category) ? '+' : '−'}
              </span>
            </button>
            
            {!collapsedCategories.has(category) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {items.map(item => (
                  <PantryItemCard
                    key={item.id}
                    item={item}
                    onSelect={onSelectItem}
                    onDelete={deleteItem}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </DndContext>
  );
}
