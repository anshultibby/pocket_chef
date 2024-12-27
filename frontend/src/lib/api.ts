import { supabase } from './supabase';
import { fetchApi } from './fetch';
import type { Recipe, RecipePreferences, PantryItemCreate, 
  PantryItem, PantryItemUpdate, RecipeInteractionCreate, 
  RecipeInteraction, InteractionType, SaveData, RateData, CookData } from '@/types';

// Helper function to get auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.access_token;
};

// Base pantry operations through backend API
const basePantryApi = {
  async getItems(): Promise<PantryItem[]> {
    const token = await getAuthToken();
    return fetchApi<PantryItem[]>('/pantry/items', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async addItems(items: PantryItemCreate[]): Promise<PantryItem[]> {
    const token = await getAuthToken();
    return fetchApi<PantryItem[]>('/pantry/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });
  },

  async updateItem(id: string, updates: PantryItemUpdate): Promise<PantryItem> {
    const token = await getAuthToken();
    return fetchApi<PantryItem>(`/pantry/items/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
  },

  async deleteItem(id: string): Promise<void> {
    const token = await getAuthToken();
    return fetchApi<void>(`/pantry/items/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async clearPantry(): Promise<void> {
    const token = await getAuthToken();
    return fetchApi<void>('/pantry/clear', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  processReceipt: async (formData: FormData): Promise<PantryItemCreate[]> => {
    const token = await getAuthToken();
    return fetchApi<PantryItemCreate[]>('/pantry/receipt/process', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
  },
};

// Combine both APIs
export const pantryApi = {
  ...basePantryApi,

  receipt: {
    process: async (formData: FormData): Promise<PantryItemCreate[]> => {
      const token = await getAuthToken();
      return fetchApi<PantryItemCreate[]>('/pantry/receipt/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
    },
  }
};

export const recipeApi = {
  generate: async (preferences: RecipePreferences): Promise<Recipe[]> => {
    const token = await getAuthToken();
    return fetchApi<Recipe[]>('/recipes/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferences),
    });
  },

  linkIngredients: async (recipeId: string): Promise<Recipe> => {
    const token = await getAuthToken();
    return fetchApi<Recipe>(`/recipes/${recipeId}/link-ingredients`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  getRecipeDetails: async (recipeId: string): Promise<Recipe> => {
    const token = await getAuthToken();
    return fetchApi<Recipe>(`/recipes/${recipeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  delete: async (recipeId: string): Promise<void> => {
    const token = await getAuthToken();
    return fetchApi<void>(`/recipes/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  interact: async (
    recipeId: string, 
    interaction: RecipeInteractionCreate
  ): Promise<RecipeInteraction> => {
    const token = await getAuthToken();
    return fetchApi<RecipeInteraction>(`/recipes/${recipeId}/interact`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(interaction),
    });
  },

  getInteractions: async (
    recipeId?: string,
    type?: InteractionType
  ): Promise<RecipeInteraction[]> => {
    const token = await getAuthToken();
    const url = recipeId 
      ? `/recipes/${recipeId}/interactions` 
      : '/recipes/interactions';
    
    const params = type ? `?interaction_type=${type}` : '';
    
    return fetchApi<RecipeInteraction[]>(`${url}${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },


  isSaveData(data: SaveData | RateData | CookData): data is SaveData {
    return 'folder' in data || 'notes' in data;
  },

  saveRecipe: async (recipeId: string, folder?: string): Promise<RecipeInteraction> => {
    try {
      // Try to create/update the save interaction
      return await recipeApi.interact(recipeId, {
        type: 'save',
        data: { folder }
      });
    } catch (error) {
      // If we get a duplicate key error, the recipe is already saved
      if (error instanceof Error && error.message.includes('duplicate key value')) {
        // Get the existing save interaction
        const interactions = await recipeApi.getInteractions(recipeId, 'save');
        if (interactions.length > 0) {
          return interactions[0];
        }
      }
      // If it's any other error, or we couldn't find the existing interaction, rethrow
      console.error('Error saving recipe:', error);
      throw error;
    }
  },

  rateRecipe: async (
    recipeId: string, 
    rating: number, 
    review?: string
  ): Promise<RecipeInteraction> => {
    return recipeApi.interact(recipeId, {
      type: 'rate',
      data: { rating, review }
    });
  },

  use: async (
    recipeId: string, 
    usage: { servings_made: number; ingredients_used: Record<string, number>; notes?: string }
  ): Promise<RecipeInteraction> => {
    return recipeApi.interact(recipeId, {
      type: 'cook',
      data: usage
    });
  },

  getAll: async (): Promise<Recipe[]> => {
    const token = await getAuthToken();
    return fetchApi<Recipe[]>('/recipes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  getRecipe: async (recipeId: string): Promise<Recipe> => {
    const token = await getAuthToken();
    return fetchApi<Recipe>(`/recipes/${recipeId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  getAllSuggestions: async (): Promise<Recipe[]> => {
    const token = await getAuthToken();
    return fetchApi<Recipe[]>('/recipes', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },
};
