import React from 'react';
import { ChatWidth } from '@/components/WidthToggle';

interface MessageInputContainerProps {
  children: React.ReactNode;
  width: ChatWidth;
}

export const MessageInputContainer: React.FC<MessageInputContainerProps> = ({ children, width }) => {
  const widthClasses = {
    regular: 'max-w-4xl',
    narrow: 'max-w-3xl',
  };

  return (
    <div className="absolute bottom-12 left-0 right-0 z-10 bg-transparent px-3 sm:px-4 py-4">
      <div className={`${widthClasses[width]} mx-auto relative`}>
        {children}
      </div>
    </div>
  );
};