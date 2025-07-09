'use client';

import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  conversationTitle: string;
}

export const DeleteConfirmation = ({ isOpen, onConfirm, onCancel, conversationTitle }: DeleteConfirmationProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onCancel();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative rounded-lg p-6 max-w-md w-full mx-4 shadow-xl"
        style={{ backgroundColor: '#252628' }}
      >
        <h3 className="text-lg font-semibold text-white mb-4">Delete conversation?</h3>
        <p className="text-gray-300 mb-6">
          This will delete &quot;{conversationTitle.length > 50 ? conversationTitle.slice(0, 50) + '...' : conversationTitle}&quot;
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-md bg-gray-600 text-gray-300 hover:text-white hover:bg-gray-500 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
