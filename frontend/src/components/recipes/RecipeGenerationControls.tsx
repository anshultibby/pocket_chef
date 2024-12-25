import { useRecipeStore } from '@/stores/recipeStore';

interface RecipeGenerationControlsProps {
  pantryItemsCount: number;
  isGenerating: boolean;
  isLoading: boolean;
  onGenerate: () => Promise<void>;
}

export default function RecipeGenerationControls({ pantryItemsCount }: RecipeGenerationControlsProps) {
  const { 
    isGenerating, 
    isLoading, 
    generateRecipes,
    setPreferences,
    preferences 
  } = useRecipeStore();

  return (
    <div>
      {/* ... controls JSX ... */}
      <button 
        onClick={generateRecipes}
        disabled={isGenerating || isLoading}
      >
        Generate Recipes
      </button>
    </div>
  );
}
