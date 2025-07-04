import React from 'react';

interface OptimizeButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

function OptimizeButton({ onClick, disabled = false }: OptimizeButtonProps) {
  const handleClick = () => {
    if (disabled) return;
    onClick?.();
  };
  
  return (
    <button
      className="rounded-full transition-all duration-200 w-8 h-8 flex items-center justify-center bg-transparent hover:bg-gray-600/50"
      onClick={handleClick}
      disabled={disabled}
      title="Optimize prompt for better results (Cmd+E)"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path 
          d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="text-gray-400"
        />
      </svg>
    </button>
  );
}

export default OptimizeButton;