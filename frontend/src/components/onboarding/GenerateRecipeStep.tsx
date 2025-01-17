import { motion } from 'framer-motion';
import { useState } from 'react';
import { OnboardingImage } from '../OnboardingImage';

interface GenerateRecipesStepProps {
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
}

export function GenerateRecipesStep({ onNext, onBack, onExit }: GenerateRecipesStepProps) {
  const [currentFeature, setCurrentFeature] = useState(0);

  const features = [
    {
      title: "Set Your Preferences",
      description: "Choose cuisines, dietary restrictions, and meal types to get personalized recipes",
      icon: "🎯",
      imagePath: { section: 'recipes', image: 'preferences' }
    },
    {
      title: "Generate Recipes",
      description: "Click generate to get AI-powered recipes based on your preferences and pantry",
      icon: "✨",
      imagePath: { section: 'recipes', image: 'generated' }
    },
    {
      title: "Check Availability",
      description: "Green means you have all ingredients, yellow some, and red few",
      icon: "📊",
      imagePath: { section: 'recipes', image: 'card' }
    }
  ] as const;

  const handleNext = () => {
    if (currentFeature < features.length - 1) {
      setCurrentFeature(prev => prev + 1);
    } else {
      onNext();
    }
  };


  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Generate & Use Recipes</h2>
      
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
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        <button
          onClick={onExit}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Skip Tutorial
        </button>
        <button
          onClick={handleNext}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
