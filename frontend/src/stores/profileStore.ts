import { create } from 'zustand';
import type { UserProfile, UserProfileUpdate } from '@/types';
import { profileApi } from '@/lib/api';

interface ProfileState {
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: UserProfileUpdate) => Promise<void>;
  setProfile: (profile: UserProfile | null) => void;
  setError: (error: string | null) => void;
}

export const useProfileStore = create<ProfileState>((set) => ({
  profile: null,
  isLoading: false,
  error: null,

  setProfile: (profile) => set({ profile }),
  setError: (error) => set({ error }),

  fetchProfile: async () => {
    try {
      set({ isLoading: true, error: null });
      const profile = await profileApi.getProfile();
      set({ profile, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load profile', 
        isLoading: false 
      });
    }
  },

  updateProfile: async (updates) => {
    try {
      set({ isLoading: true, error: null });
      // Just directly update/create the profile
      const profile = await profileApi.updateProfile(updates);
      set({ profile, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update profile', 
        isLoading: false 
      });
      throw error;
    }
  }
}));
