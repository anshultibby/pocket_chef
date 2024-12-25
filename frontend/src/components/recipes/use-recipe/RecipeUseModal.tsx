import { useEffect} from 'react';
import { Dialog } from '@headlessui/react';
import {RecipeReviewStep} from './RecipeReviewStep';
import {RecipeConfirmStep} from './RecipeConfirmStep';
import { RecipeUseModalProps } from './types';
import { useRecipeStore } from '@/stores/recipeStore';
import { useUIStore } from '@/stores/uiStore';
import { PantryItem } from '@/types';

export default function RecipeUseModal({ 
  recipe, 
  pantryItems,
  onClose, 
  onConfirmUse 
}: RecipeUseModalProps) {
  const { 
    usingRecipe,
    initializeUseRecipe,
    setServings,
    setUseStep,
    useRecipe: executeRecipeUse,
    closeUseRecipe
  } = useRecipeStore();

  const { openModal } = useUIStore();

  useEffect(() => {
    initializeUseRecipe(recipe, pantryItems);
    return () => closeUseRecipe();
  }, [recipe, pantryItems, closeUseRecipe, initializeUseRecipe]);

  // Updated with correct typing
  const handleEditItem = (data: { 
    id: string; 
    item: Omit<PantryItem, "id" | "user_id" | "created_at" | "updated_at"> & 
          Partial<Pick<PantryItem, "id" | "user_id" | "created_at" | "updated_at">>
  }) => {
    openModal('addItem', {
      initialValues: {
        data: data.item.data,
        nutrition: data.item.nutrition
      },
      itemId: data.id,
      mode: 'edit'
    });
  };

  if (!usingRecipe) return null;

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-gray-900 p-6">
            <Dialog.Title className="text-2xl font-bold text-white mb-4">
              {usingRecipe.step === 'review' ? 'Use Recipe' : 'Confirm Ingredients'}
            </Dialog.Title>

            {usingRecipe.step === 'review' ? (
              <RecipeReviewStep
                recipe={recipe}
                pantryItems={pantryItems}
                servings={usingRecipe.servings}
                onServingsChange={setServings}
                onContinue={() => setUseStep('confirm')}
                onClose={onClose}
              />
            ) : (
              <RecipeConfirmStep
                recipe={recipe}
                finalQuantities={usingRecipe.finalQuantities}
                onBack={() => setUseStep('review')}
                onConfirm={() => executeRecipeUse(onConfirmUse)}
                isConfirming={usingRecipe.isConfirming}
                onEditItem={handleEditItem}
              />
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
