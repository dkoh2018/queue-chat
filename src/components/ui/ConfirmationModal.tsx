import Button from '@/components/ui/Button';

interface ConfirmationModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  conversationTitle: string;
}

export const ConfirmationModal = ({ isOpen, onConfirm, onCancel, conversationTitle }: ConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Delete conversation?</h3>
        <p className="text-gray-300 mb-6">
          This will delete &quot;{conversationTitle.length > 50 ? conversationTitle.slice(0, 50) + '...' : conversationTitle}&quot;
        </p>
        <div className="flex gap-3 justify-end">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="text-gray-300 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            variant="danger"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};