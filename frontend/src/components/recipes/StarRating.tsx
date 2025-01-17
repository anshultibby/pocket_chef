import { motion } from 'framer-motion';
import { useState } from 'react';

interface StarRatingProps {
  rating: number;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function StarRating({ rating, onChange, disabled }: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button
          key={star}
          disabled={disabled}
          onClick={() => onChange(star)}
          onMouseEnter={() => setHoverRating(star)}
          onMouseLeave={() => setHoverRating(null)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className={`text-2xl ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span className={`
            transition-colors
            ${(hoverRating !== null ? star <= hoverRating : star <= rating)
              ? 'text-yellow-400'
              : 'text-gray-600'}
          `}>
            ★
          </span>
        </motion.button>
      ))}
    </div>
  );
}
