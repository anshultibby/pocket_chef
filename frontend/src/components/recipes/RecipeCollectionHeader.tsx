interface RecipeCollectionHeaderProps {
  recipesCount: number
  lastGeneratedAt?: string
  onGenerateNew: () => void
  pantryItemsCount: number
}

export function RecipeCollectionHeader({
  recipesCount,
  lastGeneratedAt,
  onGenerateNew,
  pantryItemsCount
}: RecipeCollectionHeaderProps) {
  return (
    <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-white">Your Recipes</h2>
          <div className="text-sm text-gray-400 space-x-2">
            <span>{recipesCount} recipes available</span>
            {lastGeneratedAt && (
              <>
                <span>•</span>
                <span>Last generated {new Date(lastGeneratedAt).toLocaleDateString()}</span>
              </>
            )}
          </div>
        </div>

        <button
          onClick={onGenerateNew}
          disabled={pantryItemsCount === 0}
          className={`px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-2
            ${pantryItemsCount === 0 
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
        >
          <span>🧝‍♂️</span>
          Generate New Recipes
        </button>
      </div>
    </div>
  );
}
