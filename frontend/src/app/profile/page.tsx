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

const defaultProfileData: UserProfileUpdate = {
  dietary_preferences: [],
  goals: [],
  cooking_experience: 'beginner',
  default_servings: 2,
  notes: ''
};

export default function ProfilePage() {
  const router = useRouter();
  const { profile, updateProfile } = useProfileStore();
  
  const { register, control, reset, handleSubmit, formState: { isSubmitting } } = useForm<UserProfileUpdate>({
    defaultValues: async () => {
      const { profile } = useProfileStore.getState();
      await useProfileStore.getState().fetchProfile();
      return profile || defaultProfileData;
    }
  });

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

  const handleCancel = () => {
    router.push('/');
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <form onSubmit={handleSubmit(onSubmit)} className="bg-gray-900 rounded-lg">
            <div className="sticky top-0 z-10 bg-gray-900 p-8 border-b border-gray-800 rounded-t-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Profile Settings</h1>
                <div className="flex gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="w-full sm:w-auto px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 
                      disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                      disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8 max-h-[calc(100vh-200px)] overflow-y-auto">
              <div className="space-y-6 bg-gray-800/50 rounded-xl p-4 sm:p-6 backdrop-blur-sm">
                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">Basic Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">
                        Display Name
                      </label>
                      <input
                        type="text"
                        className="w-full bg-gray-700/50 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h2 className="text-xl font-semibold text-white">Preferences</h2>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Your Goals
                    </label>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex flex-nowrap gap-2">
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Dietary Preferences
                    </label>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex flex-nowrap gap-2">
                        {DIETARY_PREFERENCES.map((preference) => (
                          <PreferenceButton
                            key={preference}
                            name="dietary_preferences"
                            value={preference}
                            control={control}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Cooking Experience
                    </label>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex flex-nowrap gap-2">
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Default Servings
                    </label>
                    <div className="overflow-x-auto pb-2">
                      <div className="flex flex-nowrap gap-2">
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
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">
                      Notes
                    </label>
                    <TextArea
                      name="notes"
                      control={control}
                      placeholder="Any additional notes about your preferences..."
                      className="bg-gray-700/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
