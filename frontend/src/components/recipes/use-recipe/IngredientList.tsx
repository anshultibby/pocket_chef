import { normalizeString } from '@/utils/pantry';
import { Recipe, PantryItem } from '@/types';

interface IngredientListProps {
  ingredients: Recipe['data']['ingredients'];
  pantryItems: PantryItem[];
}

export function IngredientList({ ingredients, pantryItems }: IngredientListProps) {
  return (
    <div className="space-y-2">
      <h3 className="text-gray-300 font-medium">Required Ingredients:</h3>
      <ul className="space-y-2">
        {ingredients.map((ing, idx) => {
          const matchingPantryItem = pantryItems.find(item => 
            item.data.name &&
            normalizeString(item.data.name) === normalizeString(ing.name)
          );
          
          return (
            <li 
              key={idx}
              className={`text-sm ${
                matchingPantryItem ? 'text-green-400' : 'text-yellow-500'
              }`}
            >
              {ing.quantity} {ing.unit} {ing.name}
              {matchingPantryItem && (
                <span className="text-gray-400 text-xs ml-2">
                  (Available: {matchingPantryItem.data.quantity} {matchingPantryItem.data.unit})
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
