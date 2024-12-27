import { useState, useEffect } from 'react';
import { Tab } from '@headlessui/react';
import { Recipe } from '@/types';
import { recipeApi } from '@/lib/api';
import { SavedRecipesView } from './view/SavedRecipesView';
import { CookingHistoryView } from './view/CookingHistoryView';
import { RatedRecipesView } from './view/RatedRecipesView';
import { usePantryStore } from '@/stores/pantryStore';
import { InteractionWithRecipe } from './types';
import RecipeDetailModal from '../recipes/RecipeDetailModal';
import RecipeUseModal from '../recipes/use-recipe/RecipeUseModal';
import { toast } from 'react-hot-toast';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function CookbookTab() {
  const [interactions, setInteractions] = useState<InteractionWithRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { items: pantryItems } = usePantryStore();
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [usingRecipe, setUsingRecipe] = useState<Recipe | null>(null);

  const fetchInteractionsWithRecipes = async () => {
    try {
      setIsLoading(true);
      const interactionData = await recipeApi.getInteractions();
      
      console.log('Raw interaction data:', interactionData); // Debug log
      
      const validInteractions = interactionData.filter((interaction): interaction is InteractionWithRecipe => {
        if (!interaction.recipe) return false;
        
        const recipe = interaction.recipe;
        return (
          typeof recipe === 'object' &&
          'id' in recipe &&
          'data' in recipe &&
          typeof recipe.data === 'object' &&
          recipe.data !== null &&
          'name' in recipe.data
        );
      });
      
      console.log('Valid interactions:', validInteractions);
      setInteractions(validInteractions);
      
    } catch (error) {
      console.error('Error fetching interactions:', error);
      toast.error('Failed to load cookbook items');
    } finally {
      setIsLoading(false);
    }
  };

  // Create a handler function for recipe selection
  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipe(recipe);
  };

  useEffect(() => {
    fetchInteractionsWithRecipes();
  }, []);

  const savedInteractions = interactions.filter(
    interaction => interaction.type === 'save' && interaction.recipe
  );

  const cookingInteractions = interactions.filter(
    interaction => interaction.type === 'cook' && interaction.recipe
  );

  const ratedInteractions = interactions.filter(
    interaction => interaction.type === 'rate' && interaction.recipe
  );

  return (
    <div className="w-full -mt-[1px]">
      <Tab.Group>
        <Tab.List className="flex border-b border-gray-800">
          <Tab
            className={({ selected }) =>
              classNames(
                'px-4 py-2 text-sm font-medium border-b-2 focus:outline-none -mb-[2px]',
                selected
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              )
            }
          >
            Saved Recipes
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'px-4 py-2 text-sm font-medium border-b-2 focus:outline-none -mb-[2px]',
                selected
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              )
            }
          >
            Rated Recipes
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'px-4 py-2 text-sm font-medium border-b-2 focus:outline-none -mb-[2px]',
                selected
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-700'
              )
            }
          >
            Cooking History
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-2"></div>
              <p className="text-gray-400">Loading cookbook...</p>
            </div>
          ) : (
            <>
              <Tab.Panel>
                <SavedRecipesView 
                  interactions={savedInteractions}
                  pantryItems={pantryItems}
                  onSelectRecipe={handleSelectRecipe}
                />
              </Tab.Panel>
              <Tab.Panel>
                <RatedRecipesView 
                  interactions={ratedInteractions}
                  pantryItems={pantryItems}
                  onSelectRecipe={handleSelectRecipe}
                />
              </Tab.Panel>
              <Tab.Panel>
                <CookingHistoryView 
                  interactions={cookingInteractions}
                  pantryItems={pantryItems}
                  onSelectRecipe={handleSelectRecipe}
                />
              </Tab.Panel>
            </>
          )}
        </Tab.Panels>
      </Tab.Group>

      {selectedRecipe && (
        <RecipeDetailModal
          recipe={selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          onUse={() => {
            setUsingRecipe(selectedRecipe);
            setSelectedRecipe(null);
          }}
          onRemove={() => {
            // TODO: Implement recipe removal logic
            setSelectedRecipe(null);
          }}
          pantryItems={pantryItems}
        />
      )}

      {usingRecipe && (
        <RecipeUseModal
          recipe={usingRecipe}
          pantryItems={pantryItems}
          onClose={() => {
            setUsingRecipe(null);
            setSelectedRecipe(null);
          }}
          onConfirmUse={async (ingredientsUsed) => {
            try {
              await recipeApi.use(usingRecipe.id, {
                servings_made: usingRecipe.data.servings,
                ingredients_used: ingredientsUsed
              });
              await fetchInteractionsWithRecipes(); // Refresh the interactions
              setUsingRecipe(null);
              setSelectedRecipe(null);
            } catch (error) {
              console.error('Error using recipe:', error);
              toast.error('Failed to use recipe');
            }
          }}
        />
      )}
    </div>
  );
}
