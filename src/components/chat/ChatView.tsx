import { forwardRef, memo } from 'react';
import { UIMessage } from '@/types';
import MarkdownMessage from '@/components/content/MarkdownMessage';
import { TypingDots } from '@/components/ui/TypingDots';
import styles from './ChatView.module.css';

interface ChatViewProps {
  messages: UIMessage[];
  isLoading?: boolean;
}

interface ConversationExchange {
  userInput: UIMessage | null;
  assistantResponse: UIMessage | null;
}

function createConversationExchanges(messages: UIMessage[]): ConversationExchange[] {
  const exchanges: ConversationExchange[] = [];
  let currentExchange: ConversationExchange = { userInput: null, assistantResponse: null };

  for (const message of messages) {
    if (message.role === 'user') {
      // If we already have a complete exchange (user + assistant), push it and start new
      if (currentExchange.userInput && currentExchange.assistantResponse) {
        exchanges.push(currentExchange);
        currentExchange = { userInput: message, assistantResponse: null };
      }
      // If we have a user message but no assistant response, start new exchange
      else if (currentExchange.userInput && !currentExchange.assistantResponse) {
        exchanges.push(currentExchange);
        currentExchange = { userInput: message, assistantResponse: null };
      }
      // If this is the first message or we only have an assistant response, add user
      else {
        currentExchange.userInput = message;
      }
    } else if (message.role === 'assistant') {
      // Always add assistant response to current exchange
      currentExchange.assistantResponse = message;
    }
  }

  // Push the final exchange if it has any content
  if (currentExchange.userInput || currentExchange.assistantResponse) {
    exchanges.push(currentExchange);
  }

  return exchanges;
}

export const ChatView = memo(forwardRef<HTMLDivElement, ChatViewProps>(({ messages, isLoading = false }, ref) => {
  // Ensure messages is always an array and filter out any invalid messages
  const safeMessages = Array.isArray(messages)
    ? messages.filter(msg => msg && msg.role && msg.content)
    : [];

  const conversationExchanges = createConversationExchanges(safeMessages);

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('ChatView render:', {
      messageCount: safeMessages.length,
      exchangeCount: conversationExchanges.length,
      isLoading
    });
  }
  
  return (
    <div ref={ref} className={`${styles.container} chatScroll`}>
      <div 
        className="w-full mx-auto px-4 pt-12 pb-8 max-w-[calc(100%-2rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px]"
      >
        {conversationExchanges.map((exchange, index) => {
          // Create a more stable key based on message content
          const userContent = exchange.userInput?.content?.slice(0, 50) || '';
          const assistantContent = exchange.assistantResponse?.content?.slice(0, 50) || '';
          const stableKey = `exchange-${index}-${userContent}-${assistantContent}`.replace(/\s+/g, '-');

          return (
            <div
              key={stableKey}
              className={styles.conversationExchange}
              data-conversation-exchange="true"
            >
            {exchange.userInput && (
              <div className={styles.userInputContainer}>
                <div className={styles.userInputBubble}>
                  <div className={styles.userInputText}>
                    {exchange.userInput.content}
                  </div>
                </div>
              </div>
            )}
            
            {exchange.assistantResponse && (
              <div className={styles.assistantResponseContainer}>
                <div className={styles.assistantResponseContent}>
                  <div className={`${styles.assistantResponseProse} prose prose-invert prose-sm lg:prose-lg max-w-none`}>
                    <MarkdownMessage content={exchange.assistantResponse.content} />
                  </div>
                </div>
              </div>
            )}
            </div>
          );
        })}
        
        {isLoading && (
          <div className={styles.conversationExchange} data-conversation-exchange="true">
            <div className={styles.loadingExchangeContainer}>
              <div className={styles.loadingExchangeContent}>
                <div className={`${styles.loadingExchangeProse} prose prose-invert prose-sm lg:prose-lg max-w-none`}>
                  <TypingDots className="ml-4" />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}));

ChatView.displayName = 'ChatView';