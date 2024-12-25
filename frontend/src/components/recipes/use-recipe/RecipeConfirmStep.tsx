import { RecipeConfirmStepProps } from './types';
import { IngredientCard } from './IngredientCard';
import { PantryItem } from '@/types';

export function RecipeConfirmStep({
  finalQuantities,
  onBack,
  onConfirm,
  isConfirming,
  onEditItem,
  recipe
}: RecipeConfirmStepProps) {
  return (
    <div className="space-y-6">
      <p className="text-gray-300">
        The following changes will be made to your pantry:
      </p>
      
      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {Array.from(finalQuantities.entries()).map(([id, item]) => (
          <IngredientCard
            key={id}
            id={id}
            item={item}
            recipe={recipe}
            onEdit={(data) => onEditItem({ ...data, item: { ...data.item, id: '', user_id: '', created_at: '', updated_at: '' } as PantryItem })}
          />
        ))}
      </div>
      
      <div className="flex justify-end gap-4 mt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          disabled={isConfirming}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50"
        >
          {isConfirming ? 'Confirming...' : 'Confirm Use'}
        </button>
      </div>
    </div>
  );
}
