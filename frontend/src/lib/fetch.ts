import { ApiException } from '@/types/api';
import { supabase } from './supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const fetchApi = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const fullUrl = `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, options);
    
    if (response.status === 401) {
      // Try to refresh the session
      const { data: { session } } = await supabase.auth.refreshSession();
      if (session) {
        // Retry the original request with new token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${session.access_token}`
        };
        return fetchApi<T>(url, options);
      }
      
      throw new ApiException({
        status: 401,
        message: 'Authentication failed'
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ 
        detail: 'Network response was not ok' 
      }));
      
      throw new ApiException({
        status: response.status,
        message: errorData.detail || `HTTP error! status: ${response.status}`,
        details: errorData
      });
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    
    console.error('API request failed:', error);
    throw new ApiException({
      status: 500,
      message: 'Internal client error',
      details: error
    });
  }
};

// Helper to create headers with auth token
export const createAuthHeaders = (token: string, contentType = 'application/json'): HeadersInit => ({
  'Authorization': `Bearer ${token}`,
  ...(contentType ? { 'Content-Type': contentType } : {})
});
