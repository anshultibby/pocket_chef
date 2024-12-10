'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/AuthGuard';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-gray-900 rounded-lg p-8">
            <h1 className="text-3xl font-bold mb-8">Profile</h1>
            
            <div className="space-y-6">
              <div>
                <label className="text-sm text-gray-400">Email</label>
                <div className="text-lg">{user?.email}</div>
              </div>

              <div>
                <label className="text-sm text-gray-400">User ID</label>
                <div className="text-lg font-mono text-sm">{user?.id}</div>
              </div>

              <div>
                <label className="text-sm text-gray-400">Last Sign In</label>
                <div className="text-lg">
                  {user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'N/A'}
                </div>
              </div>

              <button
                onClick={handleSignOut}
                disabled={loading}
                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
