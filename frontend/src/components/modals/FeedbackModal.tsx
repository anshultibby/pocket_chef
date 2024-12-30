import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { feedbackApi } from '@/lib/api';

interface FeedbackModalProps {
  onClose: () => void;
}

export default function FeedbackModal({ onClose }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) {
      toast.error('Please enter your feedback');
      return;
    }

    setIsSubmitting(true);
    try {
      await feedbackApi.submit(feedback.trim());
      toast.success('Thank you for your feedback!');
      onClose();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", duration: 0.3 }}
          >
            <Dialog.Panel className="w-full max-w-md rounded-xl bg-gray-900 p-6">
              <div className="flex justify-between items-start mb-6">
                <Dialog.Title className="text-2xl font-bold text-white">
                  Share Your Feedback
                </Dialog.Title>
                <button 
                  onClick={onClose}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <p className="text-gray-400 mb-4">
                Help us improve by sharing your thoughts, suggestions, or reporting issues.
              </p>

              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Enter your feedback here..."
                className="w-full h-32 bg-gray-800 rounded-lg px-3 py-2 text-white placeholder-gray-500 focus:ring-2 ring-blue-500 focus:outline-none resize-none mb-4"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !feedback.trim()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400 disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </div>
            </Dialog.Panel>
          </motion.div>
        </div>
      </div>
    </Dialog>
  );
}
