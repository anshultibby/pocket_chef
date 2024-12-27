import { PantryItem, Recipe, RecipePreferences } from "@/types"
import RecipeCardPreview from "./RecipeCardPreview"
import { formatDate } from "@/lib/utils"

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
  const date = new Date(timestamp)
  const isToday = new Date().toDateString() === date.toDateString()
  const headerDate = isToday ? 'Today' : formatDate(timestamp)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all hover:scale-105 cursor-pointer space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-medium text-white">
            {headerDate}
          </h3>
          <div className="text-sm text-gray-400 space-x-2">
            <span>{recipes.length} recipes</span>
            {preferences.cuisine.length > 0 && (
              <>
                <span>•</span>
                <span>{preferences.cuisine.join(', ')}</span>
              </>
            )}
            {preferences.dietary.length > 0 && (
              <>
                <span>•</span>
                <span>{preferences.dietary.join(', ')}</span>
              </>
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
