import React, { useState } from 'react';

interface OptimizeButtonProps {
  onClick?: () => void;
  disabled?: boolean;
}

function OptimizeButton({ onClick, disabled = false }: OptimizeButtonProps) {
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleClick = () => {
    if (isLoading || disabled) return;
    
    setIsLoading(true);
    onClick?.();
    
    // Simulate loading state
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };
  
  const buttonClasses = [
    'rounded-full transition-all duration-200 w-8 h-8 flex items-center justify-center',
    'bg-transparent hover:bg-gray-600/50',
    isLoading ? 'animate-pulse' : ''
  ].filter(Boolean).join(' ');
  
  return (
    <button
      className={buttonClasses}
      onClick={handleClick}
      disabled={!isActive || isLoading || disabled}
      title="Optimize prompt for better results (Cmd+E)"
    >
      {isLoading ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="animate-spin">
          <circle 
            cx="12" 
            cy="12" 
            r="3" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
            className={isActive && !disabled ? 'text-gray-400' : 'text-gray-400'}
          />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path 
            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={isActive && !disabled ? 'text-gray-400' : 'text-gray-400'}
          />
        </svg>
      )}
    </button>
  );
}

export default OptimizeButton;