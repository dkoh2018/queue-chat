import React from 'react';

interface QueueToggleProps {
  isOpen: boolean;
  onToggle: () => void;
  queueCount: number;
  sidebarOpen?: boolean;
  setSidebarOpen?: (open: boolean) => void;
  onCloseIntegrationPopup?: () => void;
}

export const QueueToggle: React.FC<QueueToggleProps> = ({
  isOpen,
  onToggle,
  queueCount,
  sidebarOpen,
  setSidebarOpen,
  onCloseIntegrationPopup,
}) => {
  const handleToggle = () => {
    if (!isOpen && sidebarOpen && setSidebarOpen) {
      setSidebarOpen(false);
    }
    if (!isOpen && onCloseIntegrationPopup) {
      onCloseIntegrationPopup();
    }
    onToggle();
  };

  return (
    <button
      onClick={handleToggle}
      className="absolute -top-10 right-0 z-35 backdrop-blur-xl hover:bg-white/10 border rounded-lg px-3 py-2 text-white text-sm font-medium transition-all duration-200 ease-in-out shadow-2xl hover:shadow-xl flex items-center gap-2"
      style={{
        backgroundColor: '#161618',
        borderColor: 'rgba(255, 255, 255, 0.3)'
      }}
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