import { supabase } from './supabase';
import { fetchApi } from './fetch';
import type { Recipe, PantryItemCreate, MealCategory, RecipeGenerateRequest, PantryItemWithIngredient, PantryItemUpdate } from '@/types';

// Helper function to get auth token
const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.access_token;
};

// Base pantry operations through backend API
const basePantryApi = {
  async getItems(): Promise<PantryItemWithIngredient[]> {
    const token = await getAuthToken();
    return fetchApi<PantryItemWithIngredient[]>('/pantry/items', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async addItems(items: PantryItemCreate[]): Promise<PantryItemWithIngredient[]> {
    const token = await getAuthToken();
    return fetchApi<PantryItemWithIngredient[]>('/pantry/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items)
    });
  },

  async updateItem(id: string, updates: PantryItemUpdate): Promise<PantryItemWithIngredient> {
    const token = await getAuthToken();
    return fetchApi<PantryItemWithIngredient>(`/pantry/items/${id}`, {
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
  }
};

// Complex operations through backend API
const complexPantryApi = {
  uploadReceipt: async (formData: FormData): Promise<PantryItemWithIngredient[]> => {
    const token = await getAuthToken();
    return fetchApi<PantryItemWithIngredient[]>('/pantry/upload', {
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
    const searchParams = new URLSearchParams({
      include_suggestions: includeGenerated.toString()
    });
    
    return fetchApi<Record<MealCategory, Recipe[]>>(`/recipes/by-category?${searchParams}`, {
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
  getRecipeDetails: async (id: string): Promise<Recipe> => {
    const token = await getAuthToken();
    return fetchApi<Recipe>(`/recipes/${id}`, {
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
