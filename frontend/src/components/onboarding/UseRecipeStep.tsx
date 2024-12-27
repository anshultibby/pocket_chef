import { motion } from 'framer-motion';
import { useState } from 'react';
import { OnboardingImage } from '../OnboardingImage';

interface UseRecipesStepProps {
  onComplete: () => void;
  onBack: () => void;
}

export function UseRecipesStep({ onComplete, onBack }: UseRecipesStepProps) {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: "Check Ingredient Availability",
      description: "Green ingredients are available in your pantry, yellow ones have substitutes, and red ones are missing.",
      icon: "🔍",
      imagePath: { section: 'usage', image: 'ingredients' }
    },
    {
      title: "Adjust Servings",
      description: "Scale the recipe up or down - ingredient quantities will automatically adjust.",
      icon: "⚖️",
      imagePath: { section: 'usage', image: 'servings' }
    },
    {
      title: "Track Usage",
      description: "When you cook a recipe, your pantry quantities will automatically update.",
      icon: "📝",
      imagePath: { section: 'usage', image: 'pantryUpdate' }
    }
  ] as const;

  const handleNext = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentFeature > 0) {
      setCurrentFeature(prev => prev - 1);
    } else {
      onBack();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Using Recipes</h2>
      
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between mb-6">
          {features.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                index === currentFeature ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <motion.div
          key={currentFeature}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{features[currentFeature].icon}</span>
            <h3 className="text-xl font-semibold">
              {features[currentFeature].title}
            </h3>
          </div>
          
          <p className="text-gray-300">
            {features[currentFeature].description}
          </p>

          <OnboardingImage
            section={features[currentFeature].imagePath.section}
            image={features[currentFeature].imagePath.image}
            alt={features[currentFeature].title}
            className="border border-gray-700"
          />
        </motion.div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={handlePrevious}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          {currentFeature === 0 ? 'Previous' : 'Previous'}
        </button>
        
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
        >
          {currentFeature === features.length - 1 ? 'Complete' : 'Next'}
        </button>
      </div>
    </motion.div>
  );
}
