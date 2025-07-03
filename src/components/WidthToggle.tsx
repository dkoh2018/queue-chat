import React from 'react';
import { ResizeIcon } from './icons';

export type ChatWidth = 'regular' | 'narrow';

interface WidthToggleProps {
  onClick: () => void;
  currentWidth: ChatWidth;
}

export const WidthToggle: React.FC<WidthToggleProps> = ({ onClick, currentWidth }) => {
  const getTooltip = () => {
    switch (currentWidth) {
      case 'regular': return 'Switch to narrow view';
      case 'narrow': return 'Switch to regular view';
    }
  };

  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-30 p-2 bg-gray-800/60 backdrop-blur-sm rounded-lg text-white hover:bg-gray-700/60 transition-all duration-200"
      title={getTooltip()}
    >
      <ResizeIcon />
    </button>
  );
};