import { supabase } from './supabase';
import type { PantryItem, Recipe, PantryItemCreate } from '@/types';

// Base Supabase CRUD operations
const basePantryApi = {
  async getItems(): Promise<PantryItem[]> {
    const { data, error } = await supabase
      .from('pantry_items')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async addItems(items: PantryItemCreate[]): Promise<PantryItem[]> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const itemsWithUserId = items.map(item => ({
      ...item,
      user_id: session.user.id
    }));

    const { data, error } = await supabase
      .from('pantry_items')
      .insert(itemsWithUserId)
      .select();

    if (error) throw error;
    return data;
  },

  async updateItem(id: string, updates: Partial<PantryItem>): Promise<PantryItem> {
    const { data, error } = await supabase
      .from('pantry_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async clearPantry(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('pantry_items')
      .delete()
      .eq('user_id', session.user.id);
    
    if (error) throw error;
  }
};

// Complex operations through backend API
const complexPantryApi = {
  uploadReceipt: async (formData: FormData): Promise<PantryItem[]> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    const response = await fetch('/api/pantry/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Failed to upload receipt');
    }

    return response.json();
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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('Not authenticated');

    return fetchApi<Recipe[]>('/recipes/generate', {
      method: 'POST',
      body: JSON.stringify({
        ...requestData,
        user_id: session.user.id
      })
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
