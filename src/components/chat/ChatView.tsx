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
      if (currentExchange.userInput || currentExchange.assistantResponse) {
        exchanges.push(currentExchange);
        currentExchange = { userInput: message, assistantResponse: null };
      } else {
        currentExchange.userInput = message;
      }
    } else if (message.role === 'assistant') {
      currentExchange.assistantResponse = message;
    }
  }
  
  if (currentExchange.userInput || currentExchange.assistantResponse) {
    exchanges.push(currentExchange);
  }
  
  return exchanges;
}

export const ChatView = memo(forwardRef<HTMLDivElement, ChatViewProps>(({ messages, isLoading = false }, ref) => {
  const safeMessages = Array.isArray(messages) ? messages : [];
  const conversationExchanges = createConversationExchanges(safeMessages);
  
  return (
    <div ref={ref} className={`${styles.container} chatScroll`}>
      <div 
        className="w-full mx-auto px-4 pt-12 pb-8 max-w-[calc(100%-2rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px]"
      >
        {conversationExchanges.map((exchange, index) => (
          <div
            key={`exchange-${index}`}
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
        ))}
        
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