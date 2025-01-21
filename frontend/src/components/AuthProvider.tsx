'use client';

import { ReactNode, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { AuthContext} from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/lib/api';
import { userApi } from '@/lib/api';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }

        // Enable session persistence
        const { data } = await supabase.auth.getSession();
        console.log('Retrieved session:', data.session);
        setSession(data.session);
        setUser(data.session?.user ?? null);

        // Listen for auth changes
        const { data: authSubscription } = supabase.auth.onAuthStateChange(
          async (_event, currentSession) => {
            console.log('Auth state changed:', currentSession);
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
            router.refresh();
          }
        );

        return () => {
          authSubscription?.subscription.unsubscribe();
        };
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
      },
      deleteAccount: async () => {
        try {
          // First delete all user data
          await userApi.deleteAccount();
          
          // Then sign out
          await supabase.auth.signOut();
          
          router.push('/login?message=account-deleted');
        } catch (error) {
          console.error('Error deleting account:', error);
          throw error;
        }
      },
      signInAnonymously: async () => {
        const { data, error } = await supabase.auth.signUp({
          email: `${crypto.randomUUID()}@anonymous.com`,
          password: crypto.randomUUID(),
        });
        if (error) throw error;
        
        if (data.session) {
          setSession(data.session);
          setUser(data.session.user);
          
          // Create initial profile for anonymous user
          try {
            await profileApi.createProfile();
            router.push('/onboarding');
          } catch (error) {
            console.error('Error creating profile:', error);
            throw error;
          }
        }
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
