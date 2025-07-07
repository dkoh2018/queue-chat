import React from 'react';

interface MessageInputContainerProps {
  children: React.ReactNode;
}

export const MessageInputContainer: React.FC<MessageInputContainerProps> = ({ children }) => {
  return (
    <div className="absolute bottom-12 left-0 right-0 z-50 bg-transparent px-6 sm:px-4 py-4">
      <div className="w-full mx-auto relative max-w-full sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px]">
        {children}
      </div>
    </div>
  );
};