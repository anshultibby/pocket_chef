import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create dummy values for build time
const dummyUrl = 'http://dummy-url-for-build-time';
const dummyKey = 'dummy-key-for-build-time';

// Create the client with proper error handling
export const supabase = createClient(
  supabaseUrl || dummyUrl,
  supabaseKey || dummyKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    }
  }
);

// Add runtime check for required environment variables
if (typeof window !== 'undefined') {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
  }
}
