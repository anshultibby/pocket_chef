import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { krogerApi } from '@/lib/api';
import type { KrogerProfile } from '@/types/kroger';

export default function ShoppingTab() {
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [profile, setProfile] = useState<KrogerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected') === 'true') {
      setIsAuthorized(true);
      fetchProfile();
    } else if (params.get('error') === 'auth_failed') {
      toast.error('Failed to connect to Kroger');
      setIsLoading(false);
    } else {
      // Check if we're already connected
      fetchProfile();
    }
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await krogerApi.getProfile();
      setProfile(profile);
      setIsAuthorized(true);
    } catch (error) {
      if ((error as any)?.status === 401) {
        setIsAuthorized(false);
      } else {
        toast.error('Failed to fetch Kroger profile');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const startKrogerAuth = async () => {
    try {
      setIsAuthorizing(true);
      const response = await fetch('/api/kroger/auth/start', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to start Kroger authorization');
      }

      window.location.href = data.authUrl;
    } catch (error) {
      toast.error('Failed to connect to Kroger');
    } finally {
      setIsAuthorizing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-semibold text-white mb-4">
            Connect Your Kroger Account
          </h2>
          <p className="text-gray-400 mb-8">
            Connect your Kroger account to easily add recipe ingredients to your shopping cart.
          </p>
          <button
            onClick={startKrogerAuth}
            disabled={isAuthorizing}
            className={`px-6 py-3 rounded-lg font-medium ${
              isAuthorizing
                ? 'bg-blue-500/50 text-blue-200'
                : 'bg-blue-500 text-white hover:bg-blue-400'
            }`}
          >
            {isAuthorizing ? 'Connecting...' : 'Connect to Kroger'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-500/20 rounded-full">
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-medium text-white">Connected to Kroger</h3>
            {profile && (
              <p className="text-gray-400 text-sm">{profile.email}</p>
            )}
          </div>
        </div>
      </div>
      
      {/* Shopping cart UI will go here */}
    </div>
  );
}
