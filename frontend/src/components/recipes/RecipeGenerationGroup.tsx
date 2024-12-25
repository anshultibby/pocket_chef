import { PantryItem, Recipe, RecipePreferences } from "@/types"
import RecipeCardPreview from "./RecipeCardPreview"

interface RecipeGenerationGroupProps {
  timestamp: string
  recipes: Recipe[]
  pantryItems: PantryItem[]
  preferences: RecipePreferences
  onSelectRecipe: (recipe: Recipe) => void
}

export function RecipeGenerationGroup({
  timestamp,
  recipes,
  pantryItems,
  preferences,
  onSelectRecipe
}: RecipeGenerationGroupProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-white">
            {new Date(timestamp).toLocaleDateString()} Generation
          </h3>
          <div className="text-sm text-gray-400 space-x-2">
            {preferences.cuisine.length > 0 && (
              <span>{preferences.cuisine.join(', ')}</span>
            )}
            {preferences.dietary.length > 0 && (
              <span>• {preferences.dietary.join(', ')}</span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => (
          <RecipeCardPreview
            key={recipe.id}
            recipe={recipe}
            pantryItems={pantryItems}
            onClick={() => onSelectRecipe(recipe)}
          />
        ))}
      </div>
    </div>
  );
}
