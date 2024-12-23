import { supabase } from './supabase';
import { fetchApi } from './fetch';
import type { Recipe, PantryItemCreate, MealCategory, RecipeGenerateRequest, PantryItem, PantryItemUpdate, RecipeWithAvailability } from '@/types';

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

  confirmReceipt: async (items: PantryItemCreate[]): Promise<PantryItem[]> => {
    const token = await getAuthToken();
    return fetchApi<PantryItem[]>('/pantry/receipt/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(items)
    });
  }
};

// Combine both APIs
export const pantryApi = {
  ...basePantryApi
};

// Recipe-related API calls
interface ApiResponse<T> {
  data: T;
  error?: string;
}

export const recipeApi = {
  // Get recipes by category with auto-generation if needed
  getByCategory: async (): Promise<Record<MealCategory, RecipeWithAvailability[]>> => {
    const token = await getAuthToken();
    return fetchApi<Record<MealCategory, RecipeWithAvailability[]>>('/recipes/by-category', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Get saved recipes with availability information
  getSavedWithAvailability: async (): Promise<Recipe[]> => {
    const token = await getAuthToken();
    return fetchApi<Recipe[]>('/recipes/saved', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Generate new recipes based on pantry
  generate: async (request: RecipeGenerateRequest): Promise<Recipe[]> => {
    const token = await getAuthToken();
    return fetchApi<Recipe[]>('/recipes/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });
  },

  // Get detailed recipe with nutritional info and availability
  getRecipeDetails: async (id: string): Promise<RecipeWithAvailability> => {
    const token = await getAuthToken();
    return fetchApi<RecipeWithAvailability>(`/recipes/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Save a recipe
  save: async (recipeId: string): Promise<Recipe> => {
    const token = await getAuthToken();
    return fetchApi<Recipe>(`/recipes/save/${recipeId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  // Delete a saved recipe
  deleteSaved: async (recipeId: string): Promise<void> => {
    const token = await getAuthToken();
    return fetchApi<void>(`/recipes/saved/${recipeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

export const receiptApi = {
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

  confirm: async (items: PantryItemCreate[]): Promise<PantryItem[]> => {
    const token = await getAuthToken();
    return fetchApi<PantryItem[]>('/pantry/receipt/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(items)
    });
  }
};
