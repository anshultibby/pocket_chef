import { supabase } from "./supabase";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const fetchApi = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const fullUrl = `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, options);
    
    if (response.status === 401) {
      // Try to refresh the session
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (session) {
        // Retry the original request with new token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`
        };
        return fetchApi<T>(url, options);
      }
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Network response was not ok' }));
      throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};
