import { useState, useCallback } from 'react';
import { UIMessage } from '@/types';
import { chatService, optimizationService } from '@/services';
import { UI_CONSTANTS } from '@/utils';

interface UseChatReturn {
  messages: UIMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (text: string, conversationId?: string | null) => Promise<string | null>;
  clearMessages: () => void;
  setMessages: (messages: UIMessage[]) => void;
}

export const useChat = (onConversationUpdate?: () => void): UseChatReturn => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    text: string, 
    conversationId?: string | null
  ): Promise<string | null> => {
    if (!text.trim()) return null;

    try {
      setIsLoading(true);
      setError(null);

      // Add user message to UI immediately
      const userMessage: UIMessage = { role: 'user', content: text };
      setMessages(prev => [...prev, userMessage]);

      // Step 1: Prepare conversation history for optimization (last 20 messages)
      const conversationHistory = messages.slice(-UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT);

      // Step 2: Optimize the user input with context
      console.log('🔧 Optimizing user input...');
      const optimizationResult = await optimizationService.optimizeInput({
        userInput: text,
        conversationHistory,
      });

      const optimizedInput = optimizationResult.optimizedInput || text;
      console.log('✨ Input optimized:', { original: text, optimized: optimizedInput });

      // Step 3: Create messages array with optimized input for the API
      const optimizedMessages: UIMessage[] = [
        ...messages,
        { role: 'user', content: optimizedInput },
      ];

      // Step 4: Send chat request
      console.log('💬 Sending chat message...');
      const chatResponse = await chatService.sendMessage({
        messages: optimizedMessages,
        conversationId,
        originalInput: text,
        optimizedInput,
      });

      // Add assistant response to messages
      const assistantMessage: UIMessage = { 
        role: 'assistant', 
        content: chatResponse.content 
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Refresh conversations list if callback provided
      if (onConversationUpdate) {
        onConversationUpdate();
      }

      console.log('✅ Chat message sent successfully');
      return chatResponse.conversationId;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('❌ Failed to send message:', err);
      setError(errorMessage);
      
      // Remove the user message that failed to send
      setMessages(prev => prev.slice(0, -1));
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [messages, onConversationUpdate]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    setMessages,
  };
};