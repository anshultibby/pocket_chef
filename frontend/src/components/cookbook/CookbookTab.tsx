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
    <div className="w-full px-2 py-16 sm:px-0">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1">
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:bg-gray-700/30 hover:text-white'
              )
            }
          >
            Saved Recipes
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:bg-gray-700/30 hover:text-white'
              )
            }
          >
            Rated Recipes
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                'ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-gray-700 text-white shadow'
                  : 'text-gray-400 hover:bg-gray-700/30 hover:text-white'
              )
            }
          >
            Cooking History
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-8">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4"></div>
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
          onUse={() => setUsingRecipe(selectedRecipe)}
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
          onClose={() => setUsingRecipe(null)}
        />
      )}
    </div>
  );
}
