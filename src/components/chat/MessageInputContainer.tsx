import React, { forwardRef, useEffect, useState } from 'react';

interface MessageInputContainerProps {
  children: React.ReactNode;
}

export const MessageInputContainer = forwardRef<HTMLDivElement, MessageInputContainerProps>(({ children }, ref) => {
  const [isPWA, setIsPWA] = useState(false);

  useEffect(() => {
    // Detect if running as PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone) ||
                        document.referrer.includes('android-app://');
    setIsPWA(isStandalone);
  }, []);

  // PWA-specific styles
  const pwaStyles = isPWA ? {
    bottom: '34px', // Fixed spacing for PWA mode
    paddingLeft: '16px',
    paddingRight: '16px', 
    paddingTop: '16px',
    paddingBottom: '20px'
  } : {
    bottom: 'max(18px, env(safe-area-inset-bottom))',
    paddingLeft: 'max(16px, env(safe-area-inset-left))',
    paddingRight: 'max(16px, env(safe-area-inset-right))',
    paddingTop: '16px',
    paddingBottom: '16px'
  };

  return (
    <div 
      ref={ref} 
      className={`absolute left-0 right-0 z-50 bg-transparent ${isPWA ? 'pwa-message-container' : ''}`} 
      style={pwaStyles}
    >
      <div className="w-full mx-auto relative max-w-[calc(100%-1rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px]">
        {children}
      </div>
    </div>
  );
});

MessageInputContainer.displayName = 'MessageInputContainer';