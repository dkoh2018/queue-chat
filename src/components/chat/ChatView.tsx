import { forwardRef, memo } from 'react';
import { UIMessage } from '@/types';
import MarkdownMessage from '@/components/content/MarkdownMessage';
import { TypingDots } from '@/components/ui/TypingDots';
import styles from './ChatView.module.css';

interface ChatViewProps {
  messages: UIMessage[];
  isLoading?: boolean;
}

export const ChatView = memo(forwardRef<HTMLDivElement, ChatViewProps>(({ messages, isLoading = false }, ref) => {
  // Ensure messages is always an array
  const safeMessages = Array.isArray(messages) ? messages : [];
  
  return (
    <div ref={ref} className={`${styles.container} chatScroll`}>
      <div 
        className="w-full mx-auto px-4 pt-12 pb-64 max-w-[calc(100%-2rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px]"
      >
        {safeMessages.map((msg, index) => {
          // Ensure each message has required properties
          if (!msg || typeof msg !== 'object' || !msg.role || !msg.content) {
            return null;
          }
          
          return (
            <div
              key={`${msg.role}-${index}-${msg.content.slice(0, 20)}`}
              className={msg.role === 'user' ? styles.userMessageContainer : styles.assistantMessageContainer}
            >
              <div className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}>
                {msg.role === 'assistant' ? (
                  <div className={`${styles.assistantMessageProse} prose prose-invert prose-sm lg:prose-lg max-w-none`}>
                    <MarkdownMessage content={msg.content} />
                  </div>
                ) : (
                  <div className={styles.userMessageText}>
                    {msg.content}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Loading indicator for AI response */}
        {isLoading && (
          <div className={styles.loadingContainer}>
            <div className={styles.loadingContent}>
              <div className={`${styles.loadingProse} prose prose-invert prose-sm lg:prose-lg max-w-none`}>
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