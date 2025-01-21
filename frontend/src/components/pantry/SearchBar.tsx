import { XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
  isVisible: boolean;
}

export function SearchBar({ value, onChange, onClose, isVisible }: SearchBarProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-12 inset-x-0 p-4 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800 z-50"
        >
          <div className="max-w-3xl mx-auto relative">
            <input
              type="search"
              inputMode="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Search pantry items..."
              className="w-full bg-gray-800/50 rounded-lg px-4 py-3 pr-10 text-white focus:ring-2 ring-blue-500 focus:outline-none appearance-none"
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
            <button
              onClick={onClose}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
} 