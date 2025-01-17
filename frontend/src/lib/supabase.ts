import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Capacitor } from '@capacitor/core';
import type { Preferences as CapacitorPreferences } from '@capacitor/preferences';

let preferences: typeof CapacitorPreferences | undefined;
let supabase: SupabaseClient;

// Function to initialize CapacitorPreferences
const initializePreferences = async () => {
  if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
    try {
      const { Preferences } = await import('@capacitor/preferences');
      preferences = Preferences;
      console.log('Capacitor Preferences loaded successfully:', preferences);
    } catch (error) {
      console.error('Preferences not available:', error);
    }
  }
};

// Function to initialize Supabase client
const initializeSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Missing env.NEXT_PUBLIC_SUPABASE_URL');
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://dummy-url';
    } else {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
    }
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    if (process.env.NODE_ENV === 'production') {
      console.warn('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-key';
    } else {
      throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
    }
  }

  // Create Supabase client
  supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        storage: {
          getItem: async (key: string) => {
            if (typeof window !== 'undefined') {
              if (Capacitor.isNativePlatform() && preferences) {
                const { value } = await preferences.get({ key });
                console.log('getItem using CapacitorPreferences', key, value);
                return value;
              }
              const value = localStorage.getItem(key);
              console.log('getItem using localStorage', key, value);
              return value;
            }
            return null;
          },
          setItem: async (key: string, value: string) => {
            if (typeof window !== 'undefined') {
              if (Capacitor.isNativePlatform() && preferences) {
                console.log('setItem using CapacitorPreferences', key, value);
                await preferences.set({ key, value });
              } else {
                console.log('setItem using localStorage', key, value);
                localStorage.setItem(key, value);
              }
            }
          },
          removeItem: async (key: string) => {
            if (typeof window !== 'undefined') {
              if (Capacitor.isNativePlatform() && preferences) {
                console.log('removeItem using CapacitorPreferences', key);
                await preferences.remove({ key });
              } else {
                console.log('removeItem using localStorage', key);
                localStorage.removeItem(key);
              }
            }
          },
        },
      },
      db: {
        schema: 'public',
      },
    }
  );
};

// Initialize Preferences and Supabase
const initialize = async () => {
  await initializePreferences();
  initializeSupabase();
};

// Call the initialize function immediately
initialize().catch((error) => {
  console.error('Error initializing Supabase:', error);
});

// Export the initialized Supabase client
export { supabase };
