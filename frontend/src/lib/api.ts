import { supabase } from './supabase';
import { fetchApi } from './fetch';
import type { Recipe, RecipePreferences, PantryItemCreate, 
  PantryItem, PantryItemUpdate, RecipeInteractionCreate, 
  RecipeInteraction, InteractionType, SaveData, RateData, CookData, UserProfile, UserProfileUpdate } from '@/types';
import { cache } from '@/lib/cache';


const CACHE_TTL = 5 * 60 * 1000;

const getAuthToken = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return session.access_token;
};

// Base pantry operations through backend API
const basePantryApi = {
  async getItems(): Promise<PantryItem[]> {
    const cacheKey = 'pantry-items';
    
    // Check cache first
    const cachedData = await cache.get<PantryItem[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }

    // Fetch fresh data
    const token = await getAuthToken();
    const items = await fetchApi<PantryItem[]>('/pantry/items', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // Cache the result
    await cache.set(cacheKey, items, CACHE_TTL);
    return items;
  },

  async addItems(items: PantryItemCreate[]): Promise<PantryItem[]> {
    const token = await getAuthToken();
    const result = await fetchApi<PantryItem[]>('/pantry/items', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(items),
    });

    await this.invalidateCache();
    
    return result;
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

  async invalidateCache() {
    await cache.delete('pantry-items');
  }
};

// Combine both APIs
export const pantryApi = {
  ...basePantryApi,

  receipt: {
    process: async (formData: FormData): Promise<PantryItemCreate[]> => {
      const token = await getAuthToken();
      const response = await fetchApi<PantryItemCreate[]>('/pantry/receipt/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      return response;
    },
  }
};

export const recipeApi = {
  generate: async (preferences: RecipePreferences): Promise<Recipe[]> => {
    const token = await getAuthToken();
    const recipes = await fetchApi<Recipe[]>('/recipes/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(preferences),
    });

    // Invalidate the recipes cache after generation
    await cache.delete('recipes');
    
    return recipes;
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
          return interactions[0]; // Return the existing interaction
        }
      }
      // If it's any other error, or we couldn't find the existing interaction, rethrow
      throw error;
    }
  },

  rateRecipe: async (
    recipeId: string, 
    rating: number, 
    review?: string
  ): Promise<RecipeInteraction> => {
    // Check if rating already exists
    const interactions = await recipeApi.getInteractions(recipeId);
    const existingRating = interactions.find(i => i.type === 'rate');

    if (existingRating) {
      // Update existing rating
      return fetchApi<RecipeInteraction>(`/recipes/${recipeId}/interactions/${existingRating.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${await getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'rate',
          data: { rating, review }
        })
      });
    }

    // Create new rating
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

export const profileApi = {
  async getProfile(): Promise<UserProfile> {
    const token = await getAuthToken();
    return fetchApi<UserProfile>('/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  },

  async updateProfile(updates: UserProfileUpdate): Promise<UserProfile> {
    const token = await getAuthToken();
    return fetchApi<UserProfile>('/profile', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });
  },

  async createProfile(): Promise<UserProfile> {
    const token = await getAuthToken();
    return fetchApi<UserProfile>('/profile', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};

export const feedbackApi = {
  submit: async (content: string): Promise<void> => {
    const token = await getAuthToken();
    return fetchApi<void>('/feedback', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content }),
    });
  }
};

export const userApi = {
  deleteAccount: async (): Promise<void> => {
    const token = await getAuthToken();
    return fetchApi('/users/me', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  }
};
