'use client';

import React, { useState, useEffect } from 'react';

interface TableEnlargeProps {
  children: React.ReactNode;
}

const EnlargeButton = ({ onEnlarge }: { onEnlarge: () => void }) => {
  return (
    <button
      onClick={onEnlarge}
      className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-1.5 sm:p-2 text-slate-300 hover:text-white rounded-md transition-all duration-200 backdrop-blur-sm shadow-lg hover:shadow-xl z-10"
      style={{
        backgroundColor: '#252628',
        borderColor: 'rgba(55, 56, 58, 0.5)',
        borderWidth: '1px'
      }}
      title="Enlarge table"
    >
      <svg
        className="w-3 h-3 sm:w-4 sm:h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
        />
      </svg>
    </button>
  );
};

const TableEnlarge = ({ children }: TableEnlargeProps) => {
  const [isEnlarged, setIsEnlarged] = useState(false);

  const handleEnlarge = () => {
    setIsEnlarged(true);
  };

  const handleCloseEnlarged = () => {
    setIsEnlarged(false);
  };

  // Handle ESC key to close enlarged view
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isEnlarged) {
        handleCloseEnlarged();
      }
    };

    if (isEnlarged) {
      document.addEventListener('keydown', handleKeyDown);
      // Store original overflow values more safely
      const originalBodyOverflow = document.body.style.overflow;
      const originalHtmlOverflow = document.documentElement.style.overflow;
      
      // Apply overflow hidden to prevent background scrolling
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
      
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        // Restore original overflow values safely
        document.body.style.overflow = originalBodyOverflow;
        document.documentElement.style.overflow = originalHtmlOverflow;
      };
    }
  }, [isEnlarged]);

  return (
    <>
      <div className="relative my-6 border border-gray-800 rounded-lg shadow-md">
        <div className="overflow-hidden rounded-lg">
          {children}
        </div>
        <EnlargeButton onEnlarge={handleEnlarge} />
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-6 sm:p-8 lg:p-12">
          <div 
            className="relative w-full max-w-[95vw] h-full max-h-[90vh] backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden"
            style={{
              backgroundColor: '#161618',
              borderColor: 'rgba(55, 56, 58, 0.6)',
              borderWidth: '1px'
            }}
          >
            {/* Close button */}
            <button
              onClick={handleCloseEnlarged}
              className="absolute top-4 right-4 w-8 h-8 text-slate-300 hover:text-white rounded-md border transition-all duration-200 z-20 shadow-lg hover:shadow-xl flex items-center justify-center"
              style={{
                backgroundColor: '#252628',
                borderColor: 'rgba(55, 56, 58, 0.5)'
              }}
              title="Close enlarged view (ESC)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Enlarged table container */}
            <div className="w-full h-full p-8 sm:p-10 lg:p-12 overflow-auto chat-scroll">
              <div className="min-w-full">
                <div className="border border-gray-800 rounded-lg shadow-md overflow-hidden">
                  <table className="w-full text-sm text-left text-gray-300 whitespace-nowrap">
                    {children}
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default React.memo(TableEnlarge);
