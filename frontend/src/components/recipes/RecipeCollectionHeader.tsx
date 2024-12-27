interface RecipeCollectionHeaderProps {
  recipesCount: number;
  lastGeneratedAt?: string;
}

export function RecipeCollectionHeader({
  recipesCount,
  lastGeneratedAt,
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
      </div>
    </div>
  );
}
