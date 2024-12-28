import { motion } from 'framer-motion';
import { useRef, useState } from 'react';
import { OnboardingImage } from '../OnboardingImage';

interface AddItemsStepProps {
  onNext: () => void;
  onBack: () => void;
  onExit: () => void;
}

export function AddItemsStep({ onNext, onBack, onExit }: AddItemsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentSubstep, setCurrentSubstep] = useState(0);

  const substeps = [
    {
      title: "Add Items Manually",
      description: "Add items one by one with detailed information about quantities, expiry dates, and categories",
      icon: "✏️",
      image: { section: 'addItem' as const, image: 'form' as const }
    },
    {
      title: "Upload Receipt",
      description: "Quickly add multiple items at once by scanning your grocery receipts",
      icon: "📷",
      image: { section: 'receipt' as const, image: 'upload' as const }
    }
  ] as const;

  const handleNext = () => {
    if (currentSubstep < substeps.length - 1) {
      setCurrentSubstep(prev => prev + 1);
    } else {
      onNext();
    }
  };

  const handleBack = () => {
    if (currentSubstep > 0) {
      setCurrentSubstep(prev => prev - 1);
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
      <h2 className="text-2xl font-bold text-center">Add Items to Your Pantry</h2>
      
      <div className="bg-gray-800 rounded-lg p-6">
        {/* Progress indicators */}
        <div className="flex justify-between mb-6">
          {substeps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                index === currentSubstep ? 'bg-blue-500' : 'bg-gray-700'
              }`}
            />
          ))}
        </div>

        <motion.div
          key={currentSubstep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="space-y-4"
        >
          <div className="flex items-center space-x-3">
            <span className="text-2xl">{substeps[currentSubstep].icon}</span>
            <h3 className="text-xl font-semibold">
              {substeps[currentSubstep].title}
            </h3>
          </div>
          
          <p className="text-gray-300">
            {substeps[currentSubstep].description}
          </p>

          <OnboardingImage
            section={substeps[currentSubstep].image.section}
            image={substeps[currentSubstep].image.image}
            alt={substeps[currentSubstep].title}
            className="border border-gray-700 mb-4"
          />

          {currentSubstep === 0 && (
            <button
              disabled
              className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed mx-auto block"
            >
              Add Item
            </button>
          )}

          {currentSubstep === 1 && (
            <>
              <button
                disabled
                className="px-4 py-2 bg-gray-700 text-gray-400 rounded-lg cursor-not-allowed mx-auto block"
              >
                Upload Receipt
              </button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                disabled
              />
            </>
          )}

          <p className="text-sm text-gray-500 text-center mt-2">
            Available after tutorial
          </p>
        </motion.div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={handleBack}
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
          {currentSubstep === substeps.length - 1 ? 'Continue' : 'Next'}
        </button>
      </div>
    </motion.div>
  );
}
