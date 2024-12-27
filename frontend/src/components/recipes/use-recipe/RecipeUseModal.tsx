import { useState, useEffect, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { usePantryStore } from '@/stores/pantryStore';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import toast from 'react-hot-toast';
import { RecipeReviewStep } from './RecipeReviewStep';
import { RecipeConfirmStep } from './RecipeConfirmStep';
import AddItemModal from '@/components/modals/AddItemModal';
import { RecipeUseModalProps, IngredientUpdate } from './types';
import { PantryItem, PantryItemCreate } from '@/types';
import { roundQuantity } from '@/stores/pantryStore';
import { useRecipeStore } from '@/stores/recipeStore';

export default function RecipeUseModal({ 
  recipe, 
  pantryItems,
  onClose
}: Omit<RecipeUseModalProps, 'onConfirmUse'>) {
  const recipeStore = useRecipeStore();
  const { handleError } = useErrorHandler();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [step, setStep] = useState<'review' | 'confirm'>('review');
  const [servings, setServings] = useState(recipe.data.servings);
  const [editingItem, setEditingItem] = useState<{
    id: string;
    item: PantryItem;
  } | null>(null);

  const getFinalQuantities = useCallback(() => {
    const finalQuantities = new Map<string, IngredientUpdate>();
    const scalingFactor = servings / recipe.data.servings;
    
    recipe.data.ingredients.forEach((ing) => {
      const matchingPantryItem = pantryItems.find(
        (item) => item.data.name.toLowerCase() === ing.name.toLowerCase()
      );

      if (matchingPantryItem) {
        const matches = matchingPantryItem.data.unit === ing.unit;
        const scaledQuantity = ing.quantity * scalingFactor;
        
        finalQuantities.set(matchingPantryItem.id, {
          ...matchingPantryItem,
          initial: matchingPantryItem.data.quantity ?? 0,
          final: matches 
            ? Math.max(0, (matchingPantryItem.data.quantity ?? 0) - scaledQuantity) 
            : matchingPantryItem.data.quantity ?? 0,
          matches
        });
      }
    });
    
    return finalQuantities;
  }, [recipe, pantryItems, servings]);

  const [finalQuantities, setFinalQuantities] = useState<Map<string, IngredientUpdate>>(
    () => getFinalQuantities()
  );

  useEffect(() => {
    setFinalQuantities(getFinalQuantities());
  }, [recipe, pantryItems, getFinalQuantities]);

  const handleEditItem = async (values: PantryItemCreate) => {
    if (!editingItem) return;
    
    try {
      // Update finalQuantities with the edited item
      const updatedQuantities = new Map(finalQuantities);
      const currentItem = updatedQuantities.get(editingItem.id);
      
      if (currentItem) {
        const recipeIngredient = recipe.data.ingredients.find(
          ing => ing.name.toLowerCase() === values.data.name.toLowerCase()
        );
        
        // If units match exactly, use standard logic
        const exactMatch = recipeIngredient ? values.data.unit === recipeIngredient.unit : false;
        
        // If units don't match but quantity was edited, assume user did the conversion
        const userConverted = !exactMatch && 
          values.data.quantity !== currentItem.data.quantity &&
          values.data.unit === currentItem.data.unit;

        const updatedItem = {
          ...currentItem,
          data: {
            ...currentItem.data,
            ...values.data,
          },
          nutrition: values.nutrition,
          matches: exactMatch || userConverted,
          initial: currentItem.data.quantity ?? 0,  // Keep original quantity as initial
          final: values.data.quantity ?? 0         // New quantity as final
        };

        setFinalQuantities(new Map(updatedQuantities.set(editingItem.id, updatedItem)));
      }
      
      setEditingItem(null);
    } catch (error) {
      handleError(error);
    }
  };

  const handleUse = async () => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setIsConfirming(true);
    
    try {
      await toast.promise(
        recipeStore.useRecipe(
          recipe.id,
          recipe.data.servings,
          Object.fromEntries(
            Array.from(finalQuantities).map(([key, value]) => [
              key, 
              roundQuantity(value.initial - value.final)
            ])
          )
        ),
        {
          loading: 'Using recipe...',
          success: 'Recipe used successfully!',
          error: 'Failed to use recipe'
        }
      );
      onClose();
    } catch (error) {
      handleError(error);
    } finally {
      setIsConfirming(false);
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-gray-900 p-6">
            <Dialog.Title className="text-2xl font-bold text-white mb-4">
              {step === 'review' ? 'Use Recipe' : 'Confirm Ingredients'}
            </Dialog.Title>

            {step === 'review' ? (
              <RecipeReviewStep
                recipe={recipe}
                pantryItems={pantryItems}
                servings={servings}
                onServingsChange={setServings}
                onContinue={() => setStep('confirm')}
                onClose={onClose}
              />
            ) : (
              <RecipeConfirmStep
                recipe={recipe}
                pantryItems={pantryItems}
                finalQuantities={finalQuantities}
                onBack={() => setStep('review')}
                onConfirm={handleUse}
                isConfirming={isConfirming}
                onEditItem={setEditingItem}
              />
            )}

            {editingItem && (
              <AddItemModal
                initialValues={{
                  data: editingItem.item.data,
                  nutrition: editingItem.item.nutrition
                }}
                onAdd={handleEditItem}
                onClose={() => setEditingItem(null)}
                isEditing={true}
              />
            )}
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
