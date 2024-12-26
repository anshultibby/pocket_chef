import { createClient } from '@supabase/supabase-js';

// Add debug logging
console.log('Environment variables check:', {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NODE_ENV: process.env.NODE_ENV
});

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  // Make this a warning during build
  if (process.env.NODE_ENV === 'production') {
    console.warn('Missing env.NEXT_PUBLIC_SUPABASE_URL');
    // Provide a dummy value for build time
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://dummy-url';
  } else {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
  }
}

if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  if (process.env.NODE_ENV === 'production') {
    console.warn('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Provide a dummy value for build time
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'dummy-key';
  } else {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
}

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    db: {
      schema: 'public'
    }
  }
);

// Add runtime check for required environment variables
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  // Don't log the full key in production
  console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
