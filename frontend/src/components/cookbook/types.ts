import { Recipe, RecipeInteraction } from '@/types';

export function isValidInteractionWithRecipe(
  interaction: RecipeInteraction
): interaction is InteractionWithRecipe {
  return (
    interaction.recipe !== null &&
    interaction.recipe !== undefined
  );
}

export interface InteractionWithRecipe extends Omit<RecipeInteraction, 'recipe'> {
  recipe: Recipe;
}
