import { ApiException } from '@/types/api';
import { supabase } from './supabase';
import { Capacitor } from '@capacitor/core';

const RAILWAY_URL = 'https://pocketchef-production.up.railway.app';
const LOCAL_URL = 'http://127.0.0.1:8000';

export const fetchApi = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('No active session');
      throw new ApiException({
        status: 401,
        message: 'No active session'
      });
    }

    // Create base headers
    const headers = new Headers({
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    });

    // Merge with any provided headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        headers.set(key, value);
      });
    }

    // Always use Railway for mobile
    if (Capacitor.isNativePlatform()) {
      console.log('Mobile detected, using Railway');
      console.log('Request headers:', Object.fromEntries(headers.entries())); // Debug log
      
      const response = await fetch(`${RAILWAY_URL}${url}`, {
        ...options,
        headers,
        mode: 'cors',
        credentials: 'include'
      });

      console.log('Railway response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Railway API Error:', response.status, errorText);
        throw new ApiException({
          status: response.status,
          message: errorText || 'Request failed'
        });
      }

      return response.json();
    }

    // For web development, try localhost first
    if (process.env.NODE_ENV === 'development') {
      try {
        console.log('Web development, trying localhost first...');
        const localResponse = await fetch(`${LOCAL_URL}${url}`, {
          ...options,
          headers,
          credentials: 'include'
        });
        
        if (localResponse.ok) {
          return localResponse.json();
        }
      } catch (error) {
        console.log('Localhost failed, falling back to Railway...');
      }
    }

    // Fallback to Railway for web production
    const response = await fetch(`${RAILWAY_URL}${url}`, {
      ...options,
      headers,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', response.status, errorText);
      throw new ApiException({
        status: response.status,
        message: errorText || 'Request failed'
      });
    }

    return response.json();
  } catch (error) {
    console.error('Fetch error:', error);
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

const fetchWithRetry = async <T>(url: string, options: RequestInit, retries = 3): Promise<T> => {
  try {
    return await fetchApi<T>(url, options);
  } catch (error) {
    if (retries > 0 && error instanceof ApiException && error.status >= 500) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry<T>(url, options, retries - 1);
    }
    throw error;
  }
};

const fetchWithTimeout = async <T>(url: string, options: RequestInit = {}, timeout = 10000): Promise<T> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    return await fetchApi<T>(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeoutId);
  }
};
