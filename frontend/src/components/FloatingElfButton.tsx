import { motion } from 'framer-motion';

interface FloatingElfButtonProps {
  onClick: () => void;
  pantryItemsCount: number;
}

export function FloatingElfButton({ onClick, pantryItemsCount }: FloatingElfButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={pantryItemsCount === 0}
      className="fixed bottom-6 right-6 flex items-center gap-2 px-6 py-3 rounded-full 
        bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg 
        hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="text-xl">🪄</span>
      <span className="font-medium">Generate Recipes</span>
    </motion.button>
  );
}
