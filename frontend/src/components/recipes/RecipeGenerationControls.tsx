import { useState } from 'react';
import { RecipePreferences } from '@/types';

interface RecipeGenerationControlsProps {
  onGenerate: () => void;
  isGenerating: boolean;
  isLoading: boolean;
  pantryItemsCount: number;
  preferences: RecipePreferences;
  onPreferencesChange: (preferences: Partial<RecipePreferences>) => void;
}

export default function RecipeGenerationControls({
  onGenerate,
  isGenerating,
  isLoading,
  pantryItemsCount,
  preferences,
  onPreferencesChange
}: RecipeGenerationControlsProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // Filter summary helper
  const getFilterSummary = () => {
    const summary = [];
    if (preferences.cuisine.length) summary.push(`${preferences.cuisine.length} cuisines`);
    if (preferences.dietary.length) summary.push(`${preferences.dietary.length} dietary preferences`);
    if (preferences.nutrition_goals.length) summary.push(`${preferences.nutrition_goals.length} nutrition goals`);
    return summary.join(' • ');
  };

  const cuisineOptions = [
    'Italian',
    'Asian',
    'Mexican',
    'Indian',
    'American',
    'Mediterranean',
    'French',
    'Japanese',
    'Thai',
    'Greek',
    'Other'
  ];

  const dietaryOptions = [
    'Vegetarian',
    'Vegan',
    'Gluten-Free',
    'Dairy-Free',
    'Keto',
    'Low-Carb',
    'Paleo'
  ];

  const mealTypeOptions = [
    'Breakfast',
    'Lunch',
    'Dinner',
    'Snack'
  ];

  const nutritionGoalOptions = [
    'High Protein',
    'Low Carb',
    'Low Fat',
    'Low Calorie',
    'High Fiber',
    'Low Sugar',
    'Balanced'
  ];

  return (
    <div className="bg-gray-900/50 rounded-xl p-8 backdrop-blur-sm border border-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white">Recipe Generator</h2>
          <p className="text-base text-gray-400 mt-2">
            Generate personalized recipes based on your pantry items
          </p>
          {getFilterSummary() && (
            <p className="text-sm text-gray-500 mt-2">{getFilterSummary()}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={onGenerate}
            disabled={isLoading || isGenerating || pantryItemsCount === 0}
            className={`px-6 py-2.5 rounded-lg transition-all text-base font-medium ${
              isLoading || isGenerating || pantryItemsCount === 0
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20'
            }`}
          >
            {isLoading || isGenerating ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⟳</span>
                {isGenerating ? 'Generating...' : 'Loading...'}
              </span>
            ) : (
              'Generate Recipes'
            )}
          </button>
          <button
            onClick={() => setActiveSection(activeSection ? null : 'preferences')}
            className={`px-5 py-2.5 rounded-lg transition-all flex items-center gap-2
              ${activeSection ? 'bg-gray-700 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700/80'}`}
          >
            <span className="text-lg">🎯</span>
            Customize
          </button>
        </div>
      </div>

      {/* Preferences Sections */}
      {activeSection && (
        <div className="space-y-6 mt-6 pt-6 border-t border-gray-800">
          {/* Time and Serving Controls */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Max Preparation Time</label>
              <select
                value={preferences.max_prep_time || ''}
                onChange={(e) => onPreferencesChange({ max_prep_time: Number(e.target.value) || undefined })}
                className="w-full bg-gray-800 rounded-lg p-3 text-gray-200 border border-gray-700"
              >
                <option value="">Any time</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">1 hour</option>
                <option value="90">1.5 hours</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Serving Size</label>
              <div className="flex items-center gap-4 bg-gray-800 rounded-lg p-2">
                <button
                  onClick={() => onPreferencesChange({ 
                    serving_size: Math.max(1, preferences.serving_size - 1) 
                  })}
                  className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200"
                >
                  -
                </button>
                <span className="text-xl font-medium text-gray-200 min-w-[3ch] text-center">
                  {preferences.serving_size}
                </span>
                <button
                  onClick={() => onPreferencesChange({ 
                    serving_size: Math.min(12, preferences.serving_size + 1) 
                  })}
                  className="w-10 h-10 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Meal Types */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Meal Type</label>
            <div className="flex flex-wrap gap-2">
              {mealTypeOptions.map(type => (
                <button
                  key={type}
                  onClick={() => {
                    const newTypes = preferences.meal_types.includes(type)
                      ? preferences.meal_types.filter(t => t !== type)
                      : [...preferences.meal_types, type];
                    onPreferencesChange({ meal_types: newTypes });
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    preferences.meal_types.includes(type)
                      ? 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Cuisine Preferences */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-300">Cuisine</label>
            <div className="flex flex-wrap gap-2">
              {cuisineOptions.map(cuisine => (
                <button
                  key={cuisine}
                  onClick={() => {
                    const newCuisines = preferences.cuisine.includes(cuisine)
                      ? preferences.cuisine.filter(c => c !== cuisine)
                      : [...preferences.cuisine, cuisine];
                    onPreferencesChange({ cuisine: newCuisines });
                  }}
                  className={`px-4 py-2 rounded-lg text-sm transition-all ${
                    preferences.cuisine.includes(cuisine)
                      ? 'bg-purple-500/20 text-purple-400 ring-1 ring-purple-500/50'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          </div>

          {/* Dietary and Nutrition Goals */}
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Dietary Preferences</label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map(diet => (
                  <button
                    key={diet}
                    onClick={() => {
                      const newDietary = preferences.dietary.includes(diet)
                        ? preferences.dietary.filter(d => d !== diet)
                        : [...preferences.dietary, diet];
                      onPreferencesChange({ dietary: newDietary });
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      preferences.dietary.includes(diet)
                        ? 'bg-green-500/20 text-green-400 ring-1 ring-green-500/50'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">Nutrition Goals</label>
              <div className="flex flex-wrap gap-2">
                {nutritionGoalOptions.map(goal => (
                  <button
                    key={goal}
                    onClick={() => {
                      const newGoals = preferences.nutrition_goals.includes(goal)
                        ? preferences.nutrition_goals.filter(g => g !== goal)
                        : [...preferences.nutrition_goals, goal];
                      onPreferencesChange({ nutrition_goals: newGoals });
                    }}
                    className={`px-4 py-2 rounded-lg text-sm transition-all ${
                      preferences.nutrition_goals.includes(goal)
                        ? 'bg-orange-500/20 text-orange-400 ring-1 ring-orange-500/50'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
