import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'react-hot-toast';

interface DeleteAccountModalProps {
  onClose: () => void;
}

export default function DeleteAccountModal({ onClose }: DeleteAccountModalProps) {
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const { deleteAccount } = useAuth();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirmation !== 'DELETE') return;
    
    try {
      setIsDeleting(true);
      await deleteAccount();
    } catch (error) {
      console.error('Error deleting account:', error);
      toast.error('Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <Dialog 
      open={true} 
      onClose={() => {}}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-black/70" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-lg bg-gray-900 p-6">
          <Dialog.Title className="text-xl font-bold text-white mb-4">
            Delete Account
          </Dialog.Title>
          
          <div className="space-y-4">
            <div className="bg-red-900/30 border border-red-500/50 rounded-lg p-4">
              <p className="text-red-200 text-sm">
                Warning: This action is permanent and cannot be undone. All your data, including recipes, pantry items, and preferences will be permanently deleted.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-gray-400">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full bg-gray-800 rounded-lg px-3 py-2 text-white border border-gray-700"
                placeholder="Type DELETE"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onClose();
              }}
              className="px-4 py-2 text-gray-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={confirmation !== 'DELETE' || isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
} 