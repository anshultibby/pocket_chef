import type { PantryItem, Recipe, PantryItemCreate } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Add this for debugging
console.log('API Base URL:', API_BASE_URL);

// Common error handling and request configuration
async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Create headers with proper type assertion
  const headers = new Headers(options.headers);

  // Set Content-Type if not FormData
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  
  const response = await fetch(url, {
    ...options,
    headers
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

  addItems: async (items: PantryItemCreate[]): Promise<PantryItem[]> => {
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
    const response = await fetch(`${API_BASE_URL}/pantry/items/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Failed to delete item' }));
      throw new Error(error.detail || 'Failed to delete item');
    }
  },

  getItems: async () => {
    const response = await fetch(`${API_BASE_URL}/pantry/items`);
    if (!response.ok) throw new Error('Failed to fetch pantry items');
    return response.json();
  },

  clearPantry: async () => {
    const response = await fetch(`${API_BASE_URL}/pantry/items`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to clear pantry');
    }
    return true;
  },
};

// Recipe-related API calls
export const recipeApi = {
  generate: async (requestData: {
    ingredients: string[],
    preferences?: string
  }): Promise<Recipe[]> => {
    return fetchApi<Recipe[]>('/recipes/generate', {
      method: 'POST',
      body: JSON.stringify(requestData)
    });
  },

  save: async (recipeId: string): Promise<Recipe> => {
    return fetchApi<Recipe>(`/recipes/save/${recipeId}`, {
      method: 'POST'
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
    const response = await fetch(`/api/recipes/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch recipe');
    }
    return response.json();
  },
};
