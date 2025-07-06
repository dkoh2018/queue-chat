import React from 'react';

interface MessageInputContainerProps {
  children: React.ReactNode;
}

export const MessageInputContainer: React.FC<MessageInputContainerProps> = ({ children }) => {
  return (
    <div className="absolute bottom-12 left-0 right-0 z-50 bg-transparent px-3 sm:px-4 py-4">
      <div className="w-full max-w-full mx-auto relative message-input-responsive">
        {children}
      </div>
    </div>
  );
};