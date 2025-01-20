import { motion, AnimatePresence } from 'framer-motion';

interface FloatingElfButtonProps {
  onClick: () => void;
  pantryItemsCount: number;
  isGenerating?: boolean;
}

export function FloatingElfButton({ 
  onClick, 
  pantryItemsCount,
  isGenerating 
}: FloatingElfButtonProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.8 }}
        className="fixed bottom-20 right-4 sm:bottom-4 z-20"
      >
        <motion.button
          onClick={onClick}
          className="p-4 rounded-full bg-gradient-to-r from-green-500 to-blue-500 
            text-white shadow-lg hover:from-green-400 hover:to-blue-400 
            transition-all relative shadow-green-500/20 hover:shadow-blue-500/30"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.span 
            className="text-xl"
            animate={{
              rotate: isGenerating ? 360 : 0,
            }}
            transition={{
              duration: 2,
              repeat: isGenerating ? Infinity : 0,
              ease: "linear"
            }}
          >
            🪄
            {!isGenerating && (
              <motion.span
                className="absolute -top-1 -right-1 text-xs"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [1, 0.5, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                ✨
              </motion.span>
            )}
          </motion.span>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
