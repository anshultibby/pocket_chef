'use client';

import { ReactNode, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext} from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error: sessionError } = 
          await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        setSession(initialSession);
        setUser(initialSession?.user ?? null);

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, currentSession) => {
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            router.refresh();
          }
        );

        return () => subscription.unsubscribe();
      } catch (err) {
        console.error('Auth initialization error:', err);
        setError(err instanceof Error ? err : new Error('Auth initialization failed'));
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      session,
      loading,
      error,
      signIn: async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      },
      signUp: async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { name } }
        });
        if (error) throw error;
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Create initial profile
          try {
            await profileApi.createProfile();
            router.push('/onboarding'); // Redirect to onboarding immediately
            return { session: data.session, isNewUser: true };
          } catch (error) {
            console.error('Error creating profile:', error);
          }
        }
        return { session: data.session, isNewUser: true };
      },
      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        router.push('/login');
      }
    }),
    [user, session, loading, error, router]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
