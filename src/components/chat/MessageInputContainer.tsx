import React, { forwardRef } from 'react';

interface MessageInputContainerProps {
  children: React.ReactNode;
}

export const MessageInputContainer = forwardRef<HTMLDivElement, MessageInputContainerProps>(({ children }, ref) => {
  return (
    <div ref={ref} className="absolute bottom-0 left-0 right-0 z-50 bg-transparent p-4 overflow-hidden">
      <div className="w-full mx-auto relative max-w-[calc(100%-1rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px]">
        {children}
      </div>
    </div>
  );
});

MessageInputContainer.displayName = 'MessageInputContainer';