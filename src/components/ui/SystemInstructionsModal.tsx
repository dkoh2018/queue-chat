'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface CustomPromptModalProps {
  isOpen: boolean;
  onSave: (instructions: string) => void;
  onCancel: () => void;
  currentInstructions?: string;
}

export const CustomPromptModal = ({
  isOpen,
  onSave,
  onCancel,
  currentInstructions = ''
}: CustomPromptModalProps) => {
  const [instructions, setInstructions] = useState(currentInstructions);
  const [charCount, setCharCount] = useState(currentInstructions.length);
  const maxChars = 5000;

  useEffect(() => {
    setInstructions(currentInstructions);
    setCharCount(currentInstructions.length);
  }, [currentInstructions, isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onCancel]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    if (newText.length <= maxChars) {
      setInstructions(newText);
      setCharCount(newText.length);
    }
  };

  const handleSave = () => {
    onSave(instructions.trim());
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      <div 
        className="relative w-full max-w-2xl rounded-lg border shadow-2xl"
        style={{
          backgroundColor: '#252628',
          borderColor: 'rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-white mb-2">
              Custom Prompt
            </h2>
            <p className="text-sm text-gray-400">
              Define how the AI should behave and respond. This will be added to the default system prompt.
            </p>
          </div>

          <div className="mb-4">
            <textarea
              value={instructions}
              onChange={handleTextChange}
              placeholder="Enter your custom prompt here... For example: 'You are a helpful coding assistant who explains concepts clearly and provides practical examples.'"
              className="w-full h-64 p-3 rounded-lg border resize-none text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              style={{
                backgroundColor: '#161618',
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}
            />
            <div className="flex justify-end items-center mt-2">
              <div className={`text-sm ${charCount > maxChars * 0.9 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {charCount}/{maxChars}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border text-white hover:bg-white/5 transition-colors"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.2)'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-white transition-colors"
              style={{
                backgroundColor: '#252628',
                border: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            >
              Save Instructions
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
