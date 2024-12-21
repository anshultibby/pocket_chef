import { supabase } from './supabase';
import { fetchApi } from './fetch';
import type { PantryItem, Recipe, PantryItemCreate, MealCategory, RecipeGenerateRequest } from '@/types';

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
    console.log('Sending request with items:', items); // Debug log
    
    return fetchApi<PantryItem[]>('/pantry/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items) // Send items array directly
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
  // Get recipes by category with auto-generation if needed
  getByCategory: async (includeGenerated: boolean = false): Promise<Record<MealCategory, Recipe[]>> => {
    const token = await getAuthToken();
    return fetchApi<Record<MealCategory, Recipe[]>>('/recipes/by-category', {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        include_suggestions: includeGenerated
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
  getRecipeDetails: async (id: string): Promise<Recipe> => {
    const token = await getAuthToken();
    return fetchApi<Recipe>(`/recipes/${id}`);
  }
};
