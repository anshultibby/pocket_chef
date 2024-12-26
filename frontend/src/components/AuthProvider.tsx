'use client';

import { ReactNode, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    try {
      // Check current session
      const initializeAuth = async () => {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Session error:', sessionError);
          setError(sessionError);
        }
        setUser(session?.user ?? null);
        setLoading(false);

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event);
            setUser(session?.user ?? null);
            router.refresh();
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      };

      initializeAuth();
    } catch (err) {
      console.error('Auth initialization error:', err);
      setError(err instanceof Error ? err : new Error('Auth initialization failed'));
      setLoading(false);
    }
  }, [router]);

  if (error) {
    return <div>Error initializing auth: {error.message}</div>;
  }

  if (loading) {
    return <div>Loading auth state...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}
