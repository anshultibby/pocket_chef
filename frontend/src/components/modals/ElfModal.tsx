import { Dialog } from '@headlessui/react';
import { useRecipeStore } from '@/stores/recipeStore';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { recipeApi } from '@/lib/api';
import { useState } from 'react';
import { PreferenceControls } from '@/components/recipes/PreferenceControls';

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

  const [activeSection, setActiveSection] = useState<string | null>(null);

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
          <Dialog.Panel className="w-full max-w-4xl rounded-xl bg-gray-900 p-6 shadow-lg border border-gray-800">
            <div className="flex justify-between items-start mb-8">
              <div className="flex items-center gap-6">
                <div>
                  <img 
                    src="/images/elf2.webp"
                    alt="Kitchen Elf"
                    className="w-16 h-16 object-contain rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Dialog.Title className="text-3xl font-bold text-white">
                    Recipes
                  </Dialog.Title>
                  <p className="text-gray-400 italic">
                    Set your preferences
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>
            </div>
            
            <PreferenceControls
              activeSection={activeSection}
              setActiveSection={setActiveSection}
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
