import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only throw error at runtime in production, not during build
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production' && (!supabaseUrl || !supabaseKey)) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(
  supabaseUrl || 'http://placeholder-url',
  supabaseKey || 'placeholder-key'
);
