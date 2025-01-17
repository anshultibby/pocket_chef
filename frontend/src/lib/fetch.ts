import { ApiException } from '@/types/api';
import { supabase } from './supabase';

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000'
  : process.env.NEXT_PUBLIC_API_URL;

export const fetchApi = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new ApiException({
        status: 401,
        message: 'No active session'
      });
    }

    const headers = new Headers({
      'Authorization': `Bearer ${session.access_token}`,
      ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...options.headers
    });

    const fullUrl = `${API_BASE}${url}`;

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    if (!response.ok) {
      console.error('Request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: fullUrl,
        protocol: new URL(fullUrl).protocol,
        body: await response.text()
      });
      throw new ApiException({
        status: response.status,
        message: await response.text() || 'Request failed'
      });
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
    if (error instanceof ApiException) throw error;
    throw new ApiException({
      status: 500,
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    });
  }
};

// Helper to create headers with auth token
export const createAuthHeaders = (token: string, contentType = 'application/json'): HeadersInit => ({
  'Authorization': `Bearer ${token}`,
  ...(contentType ? { 'Content-Type': contentType } : {})
});

