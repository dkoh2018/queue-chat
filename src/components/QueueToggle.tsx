import React from 'react';

interface QueueToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  queueCount: number;
}

export const QueueToggle: React.FC<QueueToggleProps> = ({
  isOpen,
  onToggle,
  queueCount,
}) => {
  return (
    <button
      onClick={onToggle}
      className="absolute -top-12 right-0 z-50 bg-black/20 backdrop-blur-xl hover:bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm font-medium transition-all duration-200 ease-in-out shadow-2xl hover:shadow-xl flex items-center gap-2"
      title={isOpen ? "Hide queue" : "Show queue"}
    >
      <span className="text-xs text-gray-300">
        Queue {queueCount > 0 ? `(${queueCount})` : ''}
      </span>
      <svg
        className={`w-4 h-4 transition-transform duration-200 ${
          isOpen ? 'rotate-180' : 'rotate-0'
        }`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    </button>
  );
};