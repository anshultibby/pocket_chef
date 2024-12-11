import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipe: Recipe) => void;
  onRemove: (id: string) => void;
}

export default function RecipeCard({ recipe, onSave, onRemove }: RecipeCardProps) {
  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-800 shadow-sm text-gray-100">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-xl font-bold text-white">{recipe.name}</h3>
        <span className="px-2 py-1 bg-gray-700 rounded-full text-xs capitalize">
          {recipe.meal_category}
        </span>
      </div>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2 text-gray-200">Ingredients:</h4>
          <ul className="list-disc pl-5">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index} className="text-sm">{ingredient}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2 text-gray-200">Instructions:</h4>
          <ol className="list-decimal pl-5">
            {recipe.instructions.map((step, index) => (
              <li key={index} className="text-sm">{step}</li>
            ))}
          </ol>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          {recipe.preparation_time && (
            <span className="px-2 py-1 bg-gray-700 rounded-full">
              ⏱️ {recipe.preparation_time} mins
            </span>
          )}
          {recipe.difficulty && (
            <span className="px-2 py-1 bg-gray-700 rounded-full capitalize">
              🔥 {recipe.difficulty}
            </span>
          )}
        </div>

        {recipe.nutritional_info && (
          <div className="bg-gray-700 p-4 rounded-lg">
            <h4 className="font-semibold mb-2 text-sm text-gray-200">Nutrition Facts</h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex justify-between">
                <span>Calories:</span>
                <span className="font-medium">{recipe.nutritional_info.calories}</span>
              </div>
              <div className="flex justify-between">
                <span>Protein:</span>
                <span className="font-medium">{recipe.nutritional_info.protein}g</span>
              </div>
              <div className="flex justify-between">
                <span>Carbs:</span>
                <span className="font-medium">{recipe.nutritional_info.carbs}g</span>
              </div>
              <div className="flex justify-between">
                <span>Fat:</span>
                <span className="font-medium">{recipe.nutritional_info.fat}g</span>
              </div>
            </div>
          </div>
        )}

        <button
          onClick={() => recipe.is_saved ? onRemove(recipe.id) : onSave?.(recipe)}
          className={`w-full py-2 px-4 rounded-lg transition-colors ${
            recipe.is_saved 
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30'
          }`}
        >
          {recipe.is_saved ? 'Remove from Saved' : 'Save Recipe'}
        </button>
      </div>
    </div>
  );
}
