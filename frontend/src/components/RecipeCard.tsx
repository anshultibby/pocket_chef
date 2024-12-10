import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipe: Recipe) => void;
  onRemove: (id: string) => void;
}

export default function RecipeCard({ recipe, onSave, onRemove }: RecipeCardProps) {
  return (
    <div className="border border-gray-700 rounded-lg p-6 bg-gray-800 shadow-sm text-gray-100">
      <h3 className="text-xl font-bold mb-4 text-white">{recipe.name}</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2 text-gray-200">Ingredients:</h4>
          <ul className="list-disc pl-5">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2 text-gray-200">Instructions:</h4>
          <ol className="list-decimal pl-5">
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        {recipe.nutritional_info && (
          <div className="bg-gray-700 p-4 rounded">
            <h4 className="font-semibold mb-2 text-gray-200">Nutritional Information:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>Calories: {recipe.nutritional_info.calories}</p>
              <p>Protein: {recipe.nutritional_info.protein}g</p>
              <p>Carbs: {recipe.nutritional_info.carbs}g</p>
              <p>Fat: {recipe.nutritional_info.fat}g</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-300">
            {recipe.preparation_time && <span>Prep time: {recipe.preparation_time}</span>}
            {recipe.difficulty && <span className="ml-4">Difficulty: {recipe.difficulty}</span>}
          </div>
          
          <button
            onClick={() => recipe.is_saved ? onRemove(recipe.id) : onSave?.(recipe)}
            className={`px-4 py-2 rounded ${
              recipe.is_saved 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {recipe.is_saved ? 'Remove' : 'Save Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
