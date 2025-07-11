'use client';

import { useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { XIcon } from '@/components/icons';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal = ({ isOpen, onClose }: KeyboardShortcutsModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
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
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcuts = [
    {
      keys: ['⌘', 'K'],
      description: 'Start a new chat conversation',
      category: 'Navigation'
    },
    {
      keys: ['⌘', '\\'],
      description: 'Toggle sidebar visibility',
      category: 'Navigation'
    },
    {
      keys: ['⌘', 'E'],
      description: 'Optimize your message for better results',
      category: 'Input'
    },
    {
      keys: ['Esc'],
      description: 'Close modals or unfocus input',
      category: 'General'
    }
  ];

  const modalContent = (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className="relative w-full max-w-lg rounded-lg border shadow-xl overflow-hidden"
        style={{ 
          backgroundColor: 'rgba(37, 38, 40, 0.95)',
          borderColor: 'rgba(55, 65, 81, 0.5)'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(55, 65, 81, 0.5)' }}>
          <h2 className="text-lg font-semibold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="text-sm text-gray-300 mb-4">
            Use these keyboard shortcuts to navigate more efficiently:
          </div>
          
          {shortcuts.map((shortcut, index) => (
            <div key={index} className="flex items-center justify-between py-2">
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{shortcut.description}</div>
                <div className="text-xs text-gray-400">{shortcut.category}</div>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                {shortcut.keys.map((key, keyIndex) => (
                  <span key={keyIndex} className="flex items-center">
                    <kbd 
                      className="px-2 py-1 text-xs font-mono rounded border text-gray-200"
                      style={{ 
                        backgroundColor: 'rgba(55, 65, 81, 0.8)',
                        borderColor: 'rgba(75, 85, 99, 0.6)'
                      }}
                    >
                      {key}
                    </kbd>
                    {keyIndex < shortcut.keys.length - 1 && (
                      <span className="mx-1 text-gray-400">+</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t text-center" style={{ borderColor: 'rgba(55, 65, 81, 0.5)' }}>
          <div className="text-xs text-gray-400">
            On Windows/Linux, use <kbd className="px-1 py-0.5 text-xs rounded bg-gray-600 text-gray-200">Ctrl</kbd> instead of <kbd className="px-1 py-0.5 text-xs rounded bg-gray-600 text-gray-200">⌘</kbd>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
