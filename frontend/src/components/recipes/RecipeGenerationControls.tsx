import { useState } from 'react';
import { useRecipeStore } from '@/stores/recipeStore';
import { RecipePreferences } from '@/types';

interface RecipeGenerationControlsProps {
  onGenerate: () => void;
  isGenerating: boolean;
  isLoading: boolean;
  pantryItemsCount: number;
}

export default function RecipeGenerationControls({
  onGenerate,
  isGenerating,
  isLoading,
  pantryItemsCount,
}: RecipeGenerationControlsProps) {
  const { preferences, setPreferences } = useRecipeStore();
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
    <div className="flex flex-wrap gap-2">
      {options.map(option => (
        <button
          key={option}
          onClick={() => togglePreference(type, option)}
          className={`px-4 py-2 rounded-lg text-sm transition-all ${
            (preferences[type] as string[]).includes(option)
              ? `bg-${colorClass}-500/20 text-${colorClass}-400 ring-1 ring-${colorClass}-500/50`
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );

  // Filter summary helper
  const getFilterSummary = () => {
    const summary = [];
    if (preferences.cuisine.length) summary.push(`${preferences.cuisine.length} cuisines`);
    if (preferences.dietary.length) summary.push(`${preferences.dietary.length} dietary preferences`);
    if (preferences.nutrition_goals.length) summary.push(`${preferences.nutrition_goals.length} nutrition goals`);
    return summary.join(' • ');
  };

  return (
    <div className="bg-gray-900/50 rounded-xl p-6 backdrop-blur-sm border border-gray-800">
      <div className="flex flex-col space-y-6">
        {/* Header - More compact */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">Recipes</h2>
            <p className="text-sm text-gray-400">
              {getFilterSummary() || 'Set your preferences'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveSection(activeSection ? null : 'preferences')}
              className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm
                ${activeSection 
                  ? 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/30' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700/80'}`}
            >
              <span className="text-base">✨</span>
              Customize
            </button>
            
            <button
              onClick={onGenerate}
              disabled={isLoading || isGenerating || pantryItemsCount === 0}
              className={`px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-2 ${
                isLoading || isGenerating || pantryItemsCount === 0
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
              }`}
            >
              {isLoading || isGenerating ? (
                <>
                  <span className="animate-spin">⟳</span>
                  {isGenerating ? 'Generating...' : 'Loading...'}
                </>
              ) : (
                <>
                  <span>🪄</span>
                  Generate
                </>
              )}
            </button>
          </div>
        </div>

        {/* Additional Preferences - More integrated */}
        <div className="relative">
          <textarea
            placeholder="Add any additional preferences or requirements (e.g., spicy food preferred, no nuts, etc.)"
            value={preferences.custom_preferences || ''}
            onChange={(e) => handlePreferencesChange({ custom_preferences: e.target.value })}
            className="w-full bg-gray-800/30 rounded-lg px-4 py-3 text-gray-200 placeholder-gray-500 
              focus:ring-1 ring-indigo-500/30 focus:outline-none text-sm h-20 resize-none"
          />
        </div>

        {/* Preferences Panel - Rest remains similar but with updated styling */}
        {activeSection && (
          <div className="space-y-6 mt-4 pt-4 border-t border-gray-800">
            {/* Time and Serving Controls */}
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-300">Max Preparation Time</label>
                  <span className="text-sm text-gray-400">
                    {preferences.max_prep_time ? `${preferences.max_prep_time} min` : 'Any time'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="15"
                  value={preferences.max_prep_time || 0}
                  onChange={(e) => handlePreferencesChange({ 
                    max_prep_time: Number(e.target.value) || undefined 
                  })}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-4
                    [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-indigo-500
                    [&::-webkit-slider-thumb]:cursor-pointer
                    [&::-moz-range-thumb]:w-4
                    [&::-moz-range-thumb]:h-4
                    [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-indigo-500
                    [&::-moz-range-thumb]:border-0"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0</span>
                  <span>30</span>
                  <span>60</span>
                  <span>90</span>
                  <span>120</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-gray-300">Serving Size</label>
                  <div className="flex items-center gap-2 bg-gray-800/50 rounded-lg p-1">
                    <button
                      onClick={() => handlePreferencesChange({ 
                        serving_size: Math.max(1, preferences.serving_size - 1) 
                      })}
                      className="w-8 h-8 rounded-md bg-gray-700/50 hover:bg-gray-600 text-gray-200 text-sm"
                    >
                      -
                    </button>
                    <span className="text-base font-medium text-gray-200 min-w-[2ch] text-center">
                      {preferences.serving_size}
                    </span>
                    <button
                      onClick={() => handlePreferencesChange({ 
                        serving_size: Math.min(12, preferences.serving_size + 1) 
                      })}
                      className="w-8 h-8 rounded-md bg-gray-700/50 hover:bg-gray-600 text-gray-200 text-sm"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Simplified preference sections using the generic renderer */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Meal Type</label>
              {renderPreferenceButtons(options.mealTypes, 'meal_types', 'blue')}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Cuisine</label>
              {renderPreferenceButtons(options.cuisine, 'cuisine', 'purple')}
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Dietary Preferences</label>
                {renderPreferenceButtons(options.dietary, 'dietary', 'green')}
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-gray-300">Nutrition Goals</label>
                {renderPreferenceButtons(options.nutritionGoals, 'nutrition_goals', 'orange')}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
