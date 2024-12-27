import { Dialog } from '@headlessui/react';
import RecipeGenerationControls from '@/components/recipes/RecipeGenerationControls';
import { useRecipeStore } from '@/stores/recipeStore';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { recipeApi } from '@/lib/api';

interface ElfModalProps {
  onClose: () => void;
  pantryItemsCount: number;
}

export default function ElfModal({ onClose, pantryItemsCount }: ElfModalProps) {
  const { handleError } = useErrorHandler();
  const { 
    isLoading,
    isGenerating,
    setIsLoading,
    setIsGenerating,
    setRecipes,
    preferences,
    setError
  } = useRecipeStore();

  const handleGenerateRecipes = async () => {
    setIsLoading(true);
    setIsGenerating(true);
    setError(null);

    try {
      const newRecipes = await recipeApi.generate(preferences);
      setRecipes(newRecipes);
      onClose();
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-4xl rounded-xl bg-gray-900 p-6">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-6">
                <div>
                  <img 
                    src="/images/kitchen-elf.png"
                    alt="Kitchen Elf"
                    className="w-20 h-20 object-contain rounded-lg"
                  />
                </div>
                <div>
                  <Dialog.Title className="text-2xl font-bold text-white">
                    Kitchen Elf
                  </Dialog.Title>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <RecipeGenerationControls
              onGenerate={handleGenerateRecipes}
              isGenerating={isGenerating}
              isLoading={isLoading}
              pantryItemsCount={pantryItemsCount}
            />
          </Dialog.Panel>
        </div>
      </div>
    </Dialog>
  );
}
