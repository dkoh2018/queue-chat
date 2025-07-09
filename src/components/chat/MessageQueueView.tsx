import React from 'react';
import { XIcon } from '@/components/icons';

interface MessageQueueViewProps {
  messageQueue: string[];
  onRemoveMessage: (message: string) => void;
  isProcessing: boolean;
  isVisible: boolean;
}

interface QueueItemProps {
  message: string;
  index: number;
  onRemoveMessage: (message: string) => void;
  isProcessing: boolean;
}

const QueueItem: React.FC<QueueItemProps> = ({ message, index, onRemoveMessage, isProcessing }) => {
  return (
    <li
      className={`flex items-center justify-between text-gray-300 glass-card p-2 rounded-md ${
        isProcessing && index === 0 ? 'animate-pulse glass-glow-green' : ''
      }`}
    >
      <span className="font-mono text-xs sm:text-sm mr-2 flex-shrink-0">{`[${index + 1}]`}</span>
      <span className="flex-1 truncate pr-2 text-sm">{message}</span>
      {/* Only show delete button if NOT the first item being processed */}
      {!(isProcessing && index === 0) && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemoveMessage(message);
          }}
          className="text-gray-400 hover:text-white glass-button p-1 rounded ml-2"
          title="Remove message"
        >
          <XIcon className="w-4 h-4" />
        </button>
      )}
    </li>
  );
};

export const MessageQueueView: React.FC<MessageQueueViewProps> = ({
  messageQueue,
  onRemoveMessage,
  isProcessing,
  isVisible,
}) => {
  if (!isVisible) {
    return null;
  }

  return (
    <div className="absolute bottom-full right-0 w-80 sm:w-96 z-110 transition-all duration-300 ease-in-out transform translate-y-0 opacity-100 max-w-[calc(100vw-2rem)]" style={{
      marginBottom: 'var(--queue-spacing, 40px)'
    }}>
      <div className="glass-panel rounded-t-2xl rounded-bl-2xl p-3 sm:p-4 border-b border-gray-600/50">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-white">
            {messageQueue.length === 0 ? 'No Queue' : `Next Prompt (${messageQueue.length})`}
          </h3>
        </div>
        <ul className={`space-y-2 overflow-y-auto chat-scroll transition-all duration-300 ${
          messageQueue.length === 0
            ? 'h-16'
            : messageQueue.length <= 4
            ? 'min-h-16 h-auto'
            : 'max-h-80 h-auto'
        }`}>
          {messageQueue.length === 0 ? (
            <li className="text-gray-400 text-center py-4 italic">
              No messages queued... yet!
            </li>
          ) : (
            messageQueue.map((message, index) => (
              <QueueItem
                key={`${message}-${index}`}
                message={message}
                index={index}
                onRemoveMessage={onRemoveMessage}
                isProcessing={isProcessing}
              />
            ))
          )}
        </ul>
      </div>
    </div>
  );
};