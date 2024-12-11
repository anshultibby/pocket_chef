import { supabase } from './supabase';
import { fetchApi } from './fetch';
import type { PantryItem, Recipe, PantryItemCreate } from '@/types';

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
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ items })
    });
  },

  async updateItem(id: string, updates: Partial<PantryItem>): Promise<PantryItem> {
    const token = await getAuthToken();
    return fetchApi<PantryItem>(`/pantry/items/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
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
  }
};

// Complex operations through backend API
const complexPantryApi = {
  uploadReceipt: async (formData: FormData): Promise<PantryItem[]> => {
    const token = await getAuthToken();
    return fetchApi<PantryItem[]>('/pantry/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
  }
};

// Combine both APIs
export const pantryApi = {
  ...basePantryApi,
  ...complexPantryApi
};

// Recipe-related API calls
export const recipeApi = {
  generate: async (requestData: {
    ingredients: string[],
    preferences?: string
  }): Promise<Recipe[]> => {
    const token = await getAuthToken();
    return fetchApi<Recipe[]>('/recipes/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(requestData)
    });
  },

  save: async (recipeId: string): Promise<Recipe> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    return fetchApi<Recipe>(`/recipes/save/${recipeId}`, {
      method: 'POST',
      body: JSON.stringify({ user_id: session.user.id })
    });
  },

  getSaved: async (): Promise<Recipe[]> => {
    return fetchApi<Recipe[]>('/recipes/saved');
  },

  deleteSaved: async (id: string): Promise<void> => {
    return fetchApi<void>(`/recipes/saved/${id}`, {
      method: 'DELETE',
    });
  },

  getGenerated: async (recipeId: string): Promise<Recipe> => {
    return fetchApi<Recipe>(`/recipes/generated/${recipeId}`);
  },

  getRecipe: async (id: string): Promise<Recipe> => {
    return fetchApi<Recipe>(`/recipes/${id}`);
  },
};
