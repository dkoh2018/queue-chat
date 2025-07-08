import React, { forwardRef } from 'react';

interface MessageInputContainerProps {
  children: React.ReactNode;
}

// Message Input Container - UI Components Layer (10-50)
export const MessageInputContainer = forwardRef<HTMLDivElement, MessageInputContainerProps>(({ children }, ref) => {
  return (
    <div
      ref={ref}
      className="absolute left-0 right-0 bottom-0 z-20 bg-transparent message-input-mobile-safe"
      style={{
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '16px',
        paddingBottom: '20px'
      }}
    >
      <div className="w-full mx-auto relative max-w-[calc(100%-1rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px]">
        {children}
      </div>
    </div>
  );
});

MessageInputContainer.displayName = 'MessageInputContainer';