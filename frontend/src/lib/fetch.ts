import { ApiException } from '@/types/api';
import { supabase } from './supabase';
import { cache } from './cache';

const API_BASE = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8000'
  : 'https://pocketchef-production.up.railway.app';

const TOKEN_CACHE_KEY = 'auth_token';
const TOKEN_CACHE_TTL = 55 * 60 * 1000; // 55 minutes in milliseconds

export const fetchApi = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    // Try to get cached token first
    let token = await cache.get<string>(TOKEN_CACHE_KEY);
    
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new ApiException({
          status: 401,
          message: 'No active session'
        });
      }
      token = session.access_token;
      
      // Cache the token
      await cache.set(TOKEN_CACHE_KEY, token, TOKEN_CACHE_TTL);
    }

    const headers = new Headers({
      'Authorization': `Bearer ${token}`,
      ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
      ...options.headers
    });

    const response = await fetch(`${API_BASE}${url}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        await cache.delete(TOKEN_CACHE_KEY); // Clear invalid token
      }
      console.error('Request failed:', {
        status: response.status,
        statusText: response.statusText,
        url: `${API_BASE}${url}`,
        protocol: new URL(`${API_BASE}${url}`).protocol,
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
