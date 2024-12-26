import { ApiException } from '@/types/api';
import { supabase } from './supabase';

// Default to production URL if not defined
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://pocketchef-production.up.railway.app';

export const fetchApi = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new ApiException({
        status: 401,
        message: 'No active session'
      });
    }

    // Add auth header
    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${session.access_token}`);
    
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (response.status === 401) {
      // Try to refresh the session
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      if (newSession?.access_token) {
        headers.set('Authorization', `Bearer ${newSession.access_token}`);
        return fetchApi<T>(url, options);
      }
      throw new ApiException({
        status: 401,
        message: 'Session expired'
      });
    }

    if (!response.ok) {
      throw new ApiException({
        status: response.status,
        message: 'Request failed'
      });
    }

    return response.json();
  } catch (error) {
    if (error instanceof ApiException) throw error;
    throw new ApiException({
      status: 500,
      message: 'Network error',
      details: error
    });
  }
};

// Helper to create headers with auth token
export const createAuthHeaders = (token: string, contentType = 'application/json'): HeadersInit => ({
  'Authorization': `Bearer ${token}`,
  ...(contentType ? { 'Content-Type': contentType } : {})
});
