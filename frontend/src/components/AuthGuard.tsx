'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const publicRoutes = ['/', '/login', '/signup', '/onboarding'];
    const protectedRoutes = ['/home', '/profile', '/settings'];
    
    if (!loading) {
      if (user) {
        // If user is logged in and tries to access login/signup pages, redirect to home
        if (['/login', '/signup'].includes(pathname)) {
          router.push('/home');
        }
      } else {
        // If user is not logged in and tries to access protected routes, redirect to login
        if (protectedRoutes.includes(pathname)) {
          router.push('/login');
        }
      }
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return <>{children}</>;
}
