import { useRecipeStore } from '@/stores/recipeStore';
import { RecipePreferences } from '@/types';
import { AnimatePresence, motion } from 'framer-motion';

interface PreferenceControlsProps {
  activeSection: string | null;
  setActiveSection: (section: string | null) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  isLoading: boolean;
  pantryItemsCount: number;
}

export function PreferenceControls({
  activeSection,
  setActiveSection,
  onGenerate,
  isGenerating,
  isLoading,
  pantryItemsCount
}: PreferenceControlsProps) {
  const { preferences, setPreferences } = useRecipeStore();

  const handlePreferencesChange = (updates: Partial<RecipePreferences>) => {
    setPreferences({ ...preferences, ...updates });
  };

  const options = {
    cuisine: ['Italian', 'Asian', 'Mexican', 'Indian', 'American', 'Mediterranean', 'French', 'Japanese', 'Thai', 'Greek', 'Other'],
    dietary: ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb', 'Paleo'],
    mealTypes: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    nutritionGoals: ['High Protein', 'Low Carb', 'Low Fat', 'Low Calorie', 'High Fiber', 'Low Sugar', 'Balanced']
  };

  // Generic toggle handler for all preference types
  const togglePreference = (type: keyof typeof preferences, value: string) => {
    const current = preferences[type] as string[];
    const updated = current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
    setPreferences({ [type]: updated });
  };

  // Generic button renderer for preference options
  const renderPreferenceButtons = (
    options: string[], 
    type: keyof typeof preferences, 
    colorClass: string
  ) => (
    <div className="flex flex-wrap gap-3">
      {options.map(option => (
        <button
          key={option}
          onClick={() => togglePreference(type, option)}
          className={`
            px-4 py-2 rounded-lg text-sm transition-all
            ${(preferences[type] as string[]).includes(option)
              ? `bg-${colorClass}-500/20 text-${colorClass}-400 
                 ring-1 ring-${colorClass}-500/50
                 shadow-lg shadow-${colorClass}-500/10
                 bg-gradient-to-br from-${colorClass}-500/30 to-${colorClass}-500/10`
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:shadow-md'
            }
          `}
        >
          {option}
        </button>
      ))}
    </div>
  );


  return (
    <div className="space-y-4">
      {/* Action buttons always visible */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => setActiveSection(activeSection ? null : 'preferences')}
          className={`
            px-4 py-2 rounded-full transition-all flex items-center justify-center gap-1.5 text-sm
            ${activeSection 
              ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30 hover:bg-indigo-500/30' 
              : 'bg-gray-800 text-gray-300 hover:bg-gray-700/80'
            }
            transform hover:scale-105 active:scale-95
          `}
        >
          <span className="text-sm">✨</span>
          Customize
        </button>
        
        <button
          onClick={onGenerate}
          disabled={isGenerating || isLoading || pantryItemsCount === 0}
          className={`
            px-4 py-2 rounded-lg transition-all text-sm font-medium 
            flex items-center justify-center gap-1.5
            transform hover:scale-105 active:scale-95
            ${isGenerating || isLoading || pantryItemsCount === 0
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
            }
          `}
        >
          {isGenerating || isLoading ? (
            <>
              <span className="animate-spin">⟳</span>
              {isGenerating ? 'Generating...' : 'Loading...'}
            </>
          ) : (
            <>
              <span className="text-sm">🪄</span>
              Generate
            </>
          )}
        </button>
      </div>

      {/* Expandable preferences section */}
      <AnimatePresence>
        {activeSection === 'preferences' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Meal Type</label>
                <div className="overflow-x-auto pb-2">
                  <div className="flex flex-nowrap gap-2">
                    {renderPreferenceButtons(options.mealTypes, 'meal_types', 'blue')}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">Cuisine</label>
                <div className="overflow-x-auto pb-2">
                  <div className="flex flex-nowrap gap-2">
                    {renderPreferenceButtons(options.cuisine, 'cuisine', 'purple')}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Dietary Preferences</label>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex flex-nowrap gap-2">
                      {renderPreferenceButtons(options.dietary, 'dietary', 'green')}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">Nutrition Goals</label>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex flex-nowrap gap-2">
                      {renderPreferenceButtons(options.nutritionGoals, 'nutrition_goals', 'orange')}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Max Preparation Time
                  </label>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">
                      {preferences.max_prep_time ? `${preferences.max_prep_time} mins` : 'Any time'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="120"
                    step="5"
                    value={preferences.max_prep_time || 0}
                    onChange={(e) => handlePreferencesChange({ 
                      max_prep_time: parseInt(e.target.value) || undefined 
                    })}
                    className="w-full accent-indigo-500 bg-gray-700 rounded-lg h-2 appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Any time</span>
                    <span>2 hours</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Serving Size
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="12"
                    value={preferences.serving_size || ''}
                    onChange={(e) => handlePreferencesChange({ 
                      serving_size: e.target.value ? parseInt(e.target.value) : undefined 
                    })}
                    className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white"
                    placeholder="e.g., 4"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-300">
                  Additional Preferences
                </label>
                <textarea
                  value={preferences.custom_preferences || ''}
                  onChange={(e) => handlePreferencesChange({ 
                    custom_preferences: e.target.value 
                  })}
                  placeholder="Any specific preferences, allergies, or dietary restrictions..."
                  className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white min-h-[80px]"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
