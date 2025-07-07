import React, { forwardRef } from 'react';

interface MessageInputContainerProps {
  children: React.ReactNode;
}

export const MessageInputContainer = forwardRef<HTMLDivElement, MessageInputContainerProps>(({ children }, ref) => {
  return (
    <div ref={ref} className="absolute left-0 right-0 z-50 bg-transparent" style={{
      bottom: 'max(18px, env(safe-area-inset-bottom))',
      paddingLeft: 'max(16px, env(safe-area-inset-left))',
      paddingRight: 'max(16px, env(safe-area-inset-right))',
      paddingTop: '16px',
      paddingBottom: '16px'
    }}>
      <div className="w-full mx-auto relative max-w-[calc(100%-1rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px]">
        {children}
      </div>
    </div>
  );
});

MessageInputContainer.displayName = 'MessageInputContainer';