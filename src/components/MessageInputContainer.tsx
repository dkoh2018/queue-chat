import React from 'react';

interface MessageInputContainerProps {
  children: React.ReactNode;
}

export const MessageInputContainer: React.FC<MessageInputContainerProps> = ({ children }) => {
  return (
    <div className="absolute bottom-12 left-0 right-0 z-10 bg-transparent px-3 sm:px-4 py-4">
      <div className="max-w-4xl mx-auto relative">
        {children}
      </div>
    </div>
  );
};