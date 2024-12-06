import type { PantryItem, Recipe} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Add this for debugging
console.log('API Base URL:', API_BASE_URL);

// Common error handling and request configuration
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Content-Type': options.body instanceof FormData ? undefined : 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || `API request failed: ${url}`);
  }

  return response.json();
}

// Pantry-related API calls
export const pantryApi = {
  uploadReceipt: async (formData: FormData): Promise<PantryItem[]> => {
    const response = await fetch(`${API_BASE_URL}/pantry/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload receipt');
    }

    return response.json();
  },

  addItems: async (items: Omit<PantryItem, 'id'>[]): Promise<PantryItem[]> => {
    return fetchApi<PantryItem[]>('/pantry/items', {
      method: 'POST',
      body: JSON.stringify(items),
    });
  },

  updateItem: async (id: string, updates: Partial<PantryItem>): Promise<PantryItem> => {
    try {
      return await fetchApi<PantryItem>(`/pantry/items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    } catch (error) {
      console.error('Update item error:', error);
      throw error; // Re-throw to handle in the component
    }
  },

  deleteItem: async (id: string): Promise<void> => {
    try {
      await fetchApi<void>(`/pantry/items/${id}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Delete item error:', error);
      throw error; // Re-throw to handle in the component
    }
  },

  getItems: async () => {
    const response = await fetch(`${API_BASE_URL}/pantry/items`);
    if (!response.ok) throw new Error('Failed to fetch pantry items');
    return response.json();
  },

  clearPantry: async (): Promise<void> => {
    return fetchApi<void>('/pantry/clear', {
      method: 'DELETE',
    });
  },
};

// Recipe-related API calls
export const recipeApi = {
  generate: async (ingredients: string[]): Promise<Recipe[]> => {
    return fetchApi<Recipe[]>('/recipes/generate', {
      method: 'POST',
      body: JSON.stringify({ ingredients }),
    });
  },

  save: async (recipe: Recipe): Promise<void> => {
    return fetchApi<void>('/recipes/save', {
      method: 'POST',
      body: JSON.stringify(recipe),
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
};
