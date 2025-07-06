import { forwardRef, memo } from 'react';
import { UIMessage } from '@/types';
import MarkdownMessage from '@/components/content/MarkdownMessage';
import { TypingDots } from '@/components/ui/TypingDots';

interface ChatViewProps {
  messages: UIMessage[];
  isLoading?: boolean;
}

export const ChatView = memo(forwardRef<HTMLDivElement, ChatViewProps>(({ messages, isLoading = false }, ref) => {
  // Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  return (
    <div ref={ref} className="flex-1 flex flex-col overflow-y-auto chat-scroll px-4 sm:px-6 lg:px-8 py-4 lg:py-8 min-h-0">
      <div className="max-w-4xl w-full mx-auto space-y-8 md:space-y-24" style={{ paddingBottom: '15rem' }}>
        {safeMessages.map((msg, index) => {
          // Ensure each message has required properties
          if (!msg || typeof msg !== 'object' || !msg.role || !msg.content) {
            console.warn('Invalid message at index', index, msg);
            return null;
          }
          
          return (
            <div
              key={`${msg.role}-${index}-${msg.content.slice(0, 20)}`}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 lg:mb-8`}
            >
              <div className={`${
                msg.role === 'user'
                  ? 'bg-gray-800 text-white rounded-2xl rounded-br-md px-3 lg:px-5 py-2 lg:py-3 border border-gray-700/50 max-w-[85%] lg:max-w-[80%] shadow-lg'
                  : 'text-gray-100 w-full max-w-[95%] lg:max-w-full'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-invert prose-sm lg:prose-lg max-w-none">
                    <MarkdownMessage content={msg.content} />
                  </div>
                ) : (
                  <div className="text-sm lg:text-[15px] leading-relaxed font-medium whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Loading indicator for AI response */}
        {isLoading && (
          <div className="flex justify-start mb-4 lg:mb-8">
            <div className="text-gray-100 w-full max-w-[95%] lg:max-w-full">
              <div className="prose prose-invert prose-sm lg:prose-lg max-w-none">
                <TypingDots className="ml-4" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}));

ChatView.displayName = 'ChatView';