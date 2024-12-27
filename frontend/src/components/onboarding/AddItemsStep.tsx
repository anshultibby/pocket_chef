import { motion } from 'framer-motion';
import { useRef } from 'react';
import { OnboardingImage } from '../OnboardingImage';

interface AddItemsStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function AddItemsStep({ onNext, onBack }: AddItemsStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <h2 className="text-2xl font-bold text-center">Add Items to Your Pantry</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-4">Upload Receipt</h3>
          <OnboardingImage
            section="receipt"
            image="upload"
            alt="Receipt upload interface"
            className="mb-4"
          />
          <p className="text-gray-400 mb-4">
            Quickly add multiple items by scanning your grocery receipt
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
          >
            Upload Receipt
          </button>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
          />
        </div>

        <div className="bg-gray-800 p-6 rounded-lg text-center">
          <h3 className="text-lg font-semibold mb-4">Add Items Manually</h3>
          <OnboardingImage
            section="addItem"
            image="form"
            alt="Add item form"
            className="mb-4"
          />
          <p className="text-gray-400 mb-4">
            Add items one by one with detailed information
          </p>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
          >
            Add Item
          </button>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        <button
          onClick={onNext}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
        >
          Continue
        </button>
      </div>
    </motion.div>
  );
}
