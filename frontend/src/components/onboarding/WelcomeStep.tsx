import { motion } from 'framer-motion';

interface WelcomeStepProps {
  userName: string;
  onNext: () => void;
  onExit: () => void;
}

export function WelcomeStep({ userName, onNext, onExit }: WelcomeStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6 text-center"
    >
      <h2 className="text-2xl font-bold">Welcome {userName}! 👋</h2>
      <p className="text-gray-300">
        Get started with managing your pantry and discovering recipes.
      </p>
      <div className="flex justify-center gap-4">
        <button
          onClick={onExit}
          className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
        >
          Skip Tutorial
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
        >
          Get Started
        </button>
      </div>
    </motion.div>
  );
}
