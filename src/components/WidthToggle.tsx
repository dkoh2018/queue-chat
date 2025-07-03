import React, { useState, useRef, useEffect } from 'react';

export type ChatWidth = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

interface WidthControlProps {
  value: ChatWidth;
  onChange: (width: ChatWidth) => void;
}

const widthOptions: { value: ChatWidth; label: string; description: string }[] = [
  { value: 'xs', label: 'XS', description: 'Very compact' },
  { value: 'sm', label: 'S', description: 'Compact' },
  { value: 'md', label: 'M', description: 'Medium' },
  { value: 'lg', label: 'L', description: 'Large' },
];

export const WidthSlider: React.FC<WidthControlProps> = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const currentIndex = widthOptions.findIndex(option => option.value === value);
  const safeIndex = currentIndex === -1 ? 3 : currentIndex; // Default to 'lg' if not found
  const currentOption = widthOptions[safeIndex];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    onChange(widthOptions[index].value);
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Toggle Button */}
      <button
        onClick={handleToggle}
        className="flex items-center space-x-2 bg-gray-800/60 backdrop-blur-sm rounded-lg px-3 py-2 text-white hover:bg-gray-700/60 transition-all duration-200"
        title={`Chat width: ${currentOption.description}`}
      >
        {/* Width icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-gray-400"
        >
          <path d="M11 17l-4-4 4-4" />
          <path d="M13 7l4 4-4 4" />
          <path d="M3 12h18" />
        </svg>
        
        {/* Current width label */}
        <span className="text-xs text-gray-300 font-medium">
          {currentOption.label}
        </span>
      </button>

      {/* Slider Popover */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-gray-800/90 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg border border-gray-600/50 z-50">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400 font-medium">Width:</span>
            <input
              type="range"
              min="0"
              max={widthOptions.length - 1}
              value={safeIndex}
              onChange={handleSliderChange}
              className="w-32 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
            />
            <span className="text-xs text-gray-300 font-medium min-w-[32px] text-center">
              {currentOption.label}
            </span>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-center">
            {currentOption.description}
          </div>
        </div>
      )}
    </div>
  );
};