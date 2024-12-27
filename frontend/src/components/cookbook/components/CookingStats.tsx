import { InteractionWithRecipe } from '../types';
import { CookData } from '@/types';

interface CookingStats {
  totalCooks: number;
  totalServings: number;
  mostCooked: {
    recipeName: string;
    count: number;
  }[];
  recentlyCookedDays: number;
  averageServings: number;
}

interface CookingStatsProps {
  interactions: InteractionWithRecipe[];
}

export function CookingStats({ interactions }: CookingStatsProps) {
  // Filter only cooking interactions
  const cookingInteractions = interactions.filter(
    (interaction): interaction is InteractionWithRecipe & { data: CookData } => 
    interaction.type === 'cook'
  );

  // Calculate statistics
  const stats = cookingInteractions.reduce<CookingStats>((acc, interaction) => {
    // Get recipe name from the interaction
    const recipeName = interaction.recipe.data.name;
    
    // Update most cooked recipes
    const recipeCount = acc.mostCooked.find(r => r.recipeName === recipeName);
    if (recipeCount) {
      recipeCount.count++;
    } else {
      acc.mostCooked.push({ recipeName, count: 1 });
    }

    // Get servings from cook data (now properly typed)
    const servingsMade = interaction.data.servings_made;

    // Calculate most recent cooking date
    const cookingDates = cookingInteractions.map(i => new Date(i.created_at).getTime());
    const mostRecentDate = cookingDates.length > 0 ? Math.max(...cookingDates) : Date.now();
    const daysSinceLastCook = Math.floor((Date.now() - mostRecentDate) / (1000 * 60 * 60 * 24));

    return {
      totalCooks: acc.totalCooks + 1,
      totalServings: acc.totalServings + servingsMade,
      mostCooked: acc.mostCooked.sort((a, b) => b.count - a.count).slice(0, 3),
      recentlyCookedDays: daysSinceLastCook,
      averageServings: Math.round((acc.totalServings + servingsMade) / (acc.totalCooks + 1) * 10) / 10
    };
  }, {
    totalCooks: 0,
    totalServings: 0,
    mostCooked: [],
    recentlyCookedDays: 0,
    averageServings: 0
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Recipes Cooked */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400">Total Recipes Cooked</h3>
        <p className="mt-2 text-2xl font-bold text-white">{stats.totalCooks}</p>
        <p className="mt-1 text-sm text-gray-500">
          {stats.totalServings} total servings
        </p>
      </div>

      {/* Average Servings */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400">Average Servings</h3>
        <p className="mt-2 text-2xl font-bold text-white">
          {stats.averageServings}
        </p>
        <p className="mt-1 text-sm text-gray-500">per recipe</p>
      </div>

      {/* Most Cooked Recipes */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400">Most Cooked</h3>
        <div className="mt-2 space-y-1">
          {stats.mostCooked.map(recipe => (
            <div key={recipe.recipeName} className="flex justify-between">
              <span className="text-white truncate">
                {recipe.recipeName}
              </span>
              <span className="text-gray-400 ml-2">
                {recipe.count}x
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-gray-800 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-400">Recent Activity</h3>
        {cookingInteractions.length > 0 ? (
          <>
            <p className="mt-2 text-2xl font-bold text-white">
              {stats.recentlyCookedDays} days
            </p>
            <p className="mt-1 text-sm text-gray-500">
              since last cooked
            </p>
          </>
        ) : (
          <p className="mt-2 text-white">No cooking activity yet</p>
        )}
      </div>
    </div>
  );
}
