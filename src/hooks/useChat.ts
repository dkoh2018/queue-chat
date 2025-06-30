import { useState, useCallback, useEffect } from 'react';
import { UIMessage } from '@/types';
import { chatService, optimizationService } from '@/services';
import { UI_CONSTANTS } from '@/utils';

interface UseChatReturn {
  messages: UIMessage[];
  messageQueue: string[];
  isLoading: boolean;
  isProcessingQueue: boolean;
  error: string | null;
  sendMessage: (text: string, conversationId?: string | null) => Promise<void>;
  clearMessages: () => void;
  setMessages: (messages: UIMessage[]) => void;
  removeMessageFromQueue: (index: number) => void;
  clearQueue: () => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
}

export const useChat = (onConversationUpdate?: () => void): UseChatReturn => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const processQueue = useCallback(async () => {
    if (isProcessingQueue || messageQueue.length === 0) {
      return;
    }

    setIsProcessingQueue(true);
    const text = messageQueue[0];

    try {
      setIsLoading(true);
      setError(null);

      const userMessage: UIMessage = { role: 'user', content: text };
      setMessages(prev => [...prev, userMessage]);

      const conversationHistory = messages.slice(-UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT);

      console.log('🔧 Optimizing user input...');
      const optimizationResult = await optimizationService.optimizeInput({
        userInput: text,
        conversationHistory,
      });

      const optimizedInput = optimizationResult.optimizedInput || text;
      console.log('✨ Input optimized:', { original: text, optimized: optimizedInput });

      const optimizedMessages: UIMessage[] = [
        ...messages,
        { role: 'user', content: optimizedInput },
      ];

      console.log('💬 Sending chat message...');
      const chatResponse = await chatService.sendMessage({
        messages: optimizedMessages,
        conversationId: currentConversationId,
        originalInput: text,
        optimizedInput,
      });

      if (chatResponse.conversationId && !currentConversationId) {
        setCurrentConversationId(chatResponse.conversationId);
      }

      const assistantMessage: UIMessage = {
        role: 'assistant',
        content: chatResponse.content,
      };
      setMessages(prev => [...prev, assistantMessage]);

      if (onConversationUpdate) {
        onConversationUpdate();
      }

      console.log('✅ Chat message sent successfully');
      setMessageQueue(prev => prev.slice(1));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      console.error('❌ Failed to send message:', err);
      setError(errorMessage);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      setIsProcessingQueue(false);
    }
  }, [isProcessingQueue, messageQueue, messages, onConversationUpdate, currentConversationId]);

  useEffect(() => {
    if (messageQueue.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [messageQueue, isProcessingQueue, processQueue]);

  const sendMessage = useCallback(async (
    text: string,
    conversationId?: string | null
  ): Promise<void> => {
    if (!text.trim()) return;
    if (conversationId && !currentConversationId) {
      setCurrentConversationId(conversationId);
    }
    setMessageQueue(prev => [...prev, text]);
  }, [currentConversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setMessageQueue([]);
    setError(null);
    setCurrentConversationId(null);
  }, []);

  const removeMessageFromQueue = useCallback((index: number) => {
    console.log('🗑️ Removing message at index:', index);
    setMessageQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index);
      console.log('🗑️ Queue before removal:', prev);
      console.log('🗑️ Queue after removal:', newQueue);
      return newQueue;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setMessageQueue([]);
  }, []);

  const reorderQueue = useCallback((startIndex: number, endIndex: number) => {
    setMessageQueue(prev => {
      const result = Array.from(prev);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return result;
    });
  }, []);

  return {
    messages,
    messageQueue,
    isLoading,
    isProcessingQueue,
    error,
    sendMessage,
    clearMessages,
    setMessages,
    removeMessageFromQueue,
    clearQueue,
    reorderQueue,
  };
};