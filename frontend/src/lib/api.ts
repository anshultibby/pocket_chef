import { supabase } from './supabase';
import { fetchApi } from './fetch';
import type { Recipe, RecipePreferences, PantryItemCreate, PantryItem, PantryItemUpdate, RecipeUsageCreate, RecipeUsage } from '@/types';

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
    try {
      console.log('Request payload:', JSON.stringify(items, null, 2));
      const response = await fetchApi<PantryItem[]>('/pantry/items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(items),
      });
      console.log('Response:', response);
      return response;
    } catch (err) {
      console.error('API error:', err);
      throw err;
    }
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

  use: async (recipeId: string, usage: RecipeUsageCreate): Promise<RecipeUsage> => {
    const token = await getAuthToken();
    return fetchApi<RecipeUsage>(`/recipes/${recipeId}/use`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(usage),
    });
  },
};
