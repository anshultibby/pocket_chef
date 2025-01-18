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
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
      >
        <motion.button
          onClick={onClick}
          disabled={pantryItemsCount === 0 || isGenerating}
          className={`
            relative flex items-center gap-2 px-6 py-3 rounded-full
            bg-gradient-to-r from-green-500 to-blue-500
            text-white shadow-lg 
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-300
            hover:shadow-xl hover:from-green-400 hover:to-blue-400
            active:shadow-inner
            backdrop-blur-sm
          `}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.95 }}
        >
          {/* Even slower glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-white opacity-0"
            animate={{
              opacity: [0, 0.15, 0],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              times: [0, 0.5, 1]
            }}
          />

          {/* Wand icon with sparkle animation */}
          <motion.span 
            className="text-xl relative"
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

          <span className="font-medium">
            {isGenerating ? 'Generating...' : 'Generate Recipes'}
          </span>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
