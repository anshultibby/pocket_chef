import { Recipe, PantryItem } from '@/types';

export interface IngredientUpdate extends Omit<PantryItem, 'id'> {
  initial: number;
  final: number;
  matches: boolean;
  id: string;
}

export interface RecipeUseModalProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  onClose: () => void;
  onConfirmUse: (ingredientsUsed: Record<string, number>) => Promise<void>;
}

export interface RecipeReviewStepProps {
  recipe: Recipe;
  pantryItems: PantryItem[];
  servings: number;
  onServingsChange: (servings: number) => void;
  onContinue: () => void;
  onClose: () => void;
}

export interface RecipeConfirmStepProps {
  finalQuantities: Map<string, IngredientUpdate>;
  onBack: () => void;
  onConfirm: () => void;
  isConfirming: boolean;
  onEditItem: (data: { 
    id: string; 
    item: Omit<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'> & Partial<Pick<PantryItem, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  }) => void;
  recipe: Recipe;
}


