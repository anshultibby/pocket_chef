import { Recipe } from '@/types';

interface RecipeCardProps {
  recipe: Recipe;
  onSave: (recipe: Recipe) => void;
  onRemove: (id: string) => void;
}

export default function RecipeCard({ recipe, onSave, onRemove }: RecipeCardProps) {
  return (
    <div className="border rounded-lg p-6 bg-white shadow-sm">
      <h3 className="text-xl font-bold mb-4">{recipe.name}</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Ingredients:</h4>
          <ul className="list-disc pl-5">
            {recipe.ingredients.map((ingredient, index) => (
              <li key={index}>{ingredient}</li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Instructions:</h4>
          <ol className="list-decimal pl-5">
            {recipe.instructions.map((step, index) => (
              <li key={index}>{step}</li>
            ))}
          </ol>
        </div>

        {recipe.nutritionalInfo && (
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-semibold mb-2">Nutritional Information:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <p>Calories: {recipe.nutritionalInfo.calories}</p>
              <p>Protein: {recipe.nutritionalInfo.protein}g</p>
              <p>Carbs: {recipe.nutritionalInfo.carbs}g</p>
              <p>Fat: {recipe.nutritionalInfo.fat}g</p>
            </div>
          </div>
        )}

        <div className="flex justify-between items-center pt-4">
          <div className="text-sm text-gray-600">
            {recipe.preparationTime && <span>Prep time: {recipe.preparationTime}</span>}
            {recipe.difficulty && <span className="ml-4">Difficulty: {recipe.difficulty}</span>}
          </div>
          
          <button
            onClick={() => recipe.isSaved ? onRemove(recipe.id) : onSave(recipe)}
            className={`px-4 py-2 rounded ${
              recipe.isSaved 
                ? 'bg-red-500 text-white hover:bg-red-600' 
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {recipe.isSaved ? 'Remove' : 'Save Recipe'}
          </button>
        </div>
      </div>
    </div>
  );
}
