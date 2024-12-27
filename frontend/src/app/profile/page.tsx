'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AuthGuard } from '@/components/AuthGuard';
import { useAuth } from '@/lib/auth-context';
import { useProfileStore } from '@/stores/profileStore';
import { TextArea } from '@/components/forms/TextArea';
import { 
  DIETARY_PREFERENCES, 
  USER_GOALS, 
  COOKING_EXPERIENCE_LABELS,
  DEFAULT_SERVINGS_OPTIONS
} from '@/constants/profile';
import type { UserProfileUpdate } from '@/types';
import { useRouter } from 'next/navigation';
import { PreferenceButton, ServingsButton, ExperienceButton } from '@/components/forms/Buttons';

export default function ProfilePage() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { profile, isLoading, updateProfile } = useProfileStore();
  
  const { control, handleSubmit, reset } = useForm<UserProfileUpdate>();

  useEffect(() => {
    if (profile) {
      reset({
        dietary_preferences: profile.dietary_preferences,
        goals: profile.goals,
        cooking_experience: profile.cooking_experience,
        default_servings: profile.default_servings,
        notes: profile.notes ?? ''
      });
    }
  }, [profile, reset]);

  const onSubmit = async (data: UserProfileUpdate) => {
    try {
      await updateProfile(data);
      router.push('/');
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="bg-gray-900 rounded-lg p-8 space-y-8">
            <h1 className="text-3xl font-bold">Profile Settings</h1>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Dietary Preferences
                </label>
                <div className="flex flex-wrap gap-2">
                  {DIETARY_PREFERENCES.map((pref) => (
                    <PreferenceButton
                      key={pref}
                      name="dietary_preferences"
                      value={pref}
                      control={control}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Your Goals
                </label>
                <div className="flex flex-wrap gap-2">
                  {USER_GOALS.map((goal) => (
                    <PreferenceButton
                      key={goal}
                      name="goals"
                      value={goal}
                      control={control}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Cooking Experience
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(COOKING_EXPERIENCE_LABELS).map(([value, label]) => (
                    <ExperienceButton
                      key={value}
                      name="cooking_experience"
                      value={value}
                      label={label}
                      control={control}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Default Servings
                </label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_SERVINGS_OPTIONS.map((servings) => (
                    <ServingsButton
                      key={servings}
                      name="default_servings"
                      value={servings}
                      control={control}
                    />
                  ))}
                </div>
              </div>

              <TextArea
                name="notes"
                control={control}
                label="Additional Notes"
                placeholder="Add any dietary restrictions or preferences..."
                disabled={isLoading}
              />

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold 
                           py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-semibold 
                           py-3 px-4 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>

            <div className="space-y-4">
              <button
                onClick={() => router.push('/onboarding')}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 
                         font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Redo Onboarding
              </button>

              <button
                onClick={() => signOut()}
                className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 
                         font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
