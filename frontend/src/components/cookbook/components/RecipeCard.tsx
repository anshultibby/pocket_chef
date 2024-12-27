import { Recipe, PantryItem, RateData, SaveData, CookData } from '@/types';
import { formatDate } from '@/lib/utils';
import { InteractionWithRecipe } from '../types';
import { calculateRecipeAvailability } from '@/stores/recipeStore';

interface RecipeCardProps {
  recipe: Recipe;
  interaction: InteractionWithRecipe;
  pantryItems: PantryItem[];
  onClick: () => void;
}

export function RecipeCard({ recipe, interaction, pantryItems, onClick }: RecipeCardProps) {
  // Type guard functions
  const isCookData = (data: SaveData | RateData | CookData): data is CookData => {
    return interaction.type === 'cook';
  };

  const isRateData = (data: SaveData | RateData | CookData): data is RateData => {
    return interaction.type === 'rate';
  };

  const isSaveData = (data: SaveData | RateData | CookData): data is SaveData => {
    return interaction.type === 'save';
  };

  const { percentage: availability } = calculateRecipeAvailability(recipe, pantryItems);

  return (
    <div 
      onClick={onClick}
      className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-700 cursor-pointer transition-colors"
    >
      <div className="p-4 space-y-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-white">
            {recipe.data.name}
          </h3>
          {isRateData(interaction.data) && (
            <div className="flex items-center gap-1">
              <span className="text-yellow-400">★</span>
              <span className="text-white">
                {interaction.data.rating}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>{recipe.data.preparation_time} mins</span>
            <span>{availability}% available</span>
          </div>

          {isSaveData(interaction.data) && interaction.data.folder && (
            <div className="text-sm text-gray-400">
              Folder: {interaction.data.folder}
            </div>
          )}

          {isRateData(interaction.data) && interaction.data.review && (
            <p className="text-sm text-gray-300 italic">
              &ldquo;{interaction.data.review}&rdquo;
            </p>
          )}

          {isCookData(interaction.data) && (
            <div className="text-sm text-gray-400">
              <p>Servings made: {interaction.data.servings_made}</p>
              {interaction.data.notes && (
                <p className="text-gray-300 mt-1">
                  Notes: {interaction.data.notes}
                </p>
              )}
            </div>
          )}

          <div className="text-xs text-gray-500">
            {interaction.type === 'save' ? 'Saved' : 
             interaction.type === 'rate' ? 'Rated' : 'Cooked'} on {formatDate(interaction.created_at)}
          </div>
        </div>
      </div>
    </div>
  );
}
