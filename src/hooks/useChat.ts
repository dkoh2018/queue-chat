import { useState, useCallback, useEffect, useRef } from 'react';
import { UIMessage, IntegrationType } from '@/types';
import { chatService } from '@/services';
import { UI_CONSTANTS } from '@/utils';
import { getIntegrationsByIds, IntegrationProcessResult } from '@/integrations';
import { useTokenRefresh } from './useTokenRefresh';
import { supabase } from '@/lib/supabase';


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
  clearAllData: () => void;
  activeIntegrations: IntegrationType[];
  setActiveIntegrations: (integrations: IntegrationType[]) => void;
  toggleIntegration: (integration: IntegrationType) => void;
  clearError: () => void;
}

export const useChat = (onMessageSent?: (conversationId: string) => void): UseChatReturn => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [activeIntegrations, setActiveIntegrations] = useState<IntegrationType[]>([]);
  
  // Use refs to avoid stale closures
  const messagesRef = useRef<UIMessage[]>([]);
  const processingRef = useRef<boolean>(false);
  const messageSentRef = useRef<((conversationId: string) => void) | undefined>(onMessageSent);
  
  // Keep token refresh hook for backward compatibility
  useTokenRefresh();

  // Update refs when state changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    processingRef.current = isProcessingQueue;
  }, [isProcessingQueue]);

  useEffect(() => {
    messageSentRef.current = onMessageSent;
  }, [onMessageSent]);

  const processQueue = useCallback(async () => {
    // Enhanced guard - prevent multiple simultaneous processing
    if (processingRef.current || messageQueue.length === 0) {
      return;
    }

    const text = messageQueue[0];
    if (!text?.trim()) {
      setMessageQueue(prev => prev.slice(1));
      return;
    }

    setIsProcessingQueue(true);
    setError(null);

    try {
      // **IMMEDIATE**: Update conversation order FIRST for instant feedback
      if (messageSentRef.current && currentConversationId) {
        messageSentRef.current(currentConversationId);
      }
      
      // Add user message immediately for instant feedback
      const userMessage: UIMessage = { role: 'user', content: text };
      setMessages(prev => [...prev, userMessage]);
      
      // Start loading indicator
      setIsLoading(true);
      
      // Prepare conversation history using current state
      const currentMessages = [...messagesRef.current, userMessage];
      const conversationHistory = currentMessages.slice(-UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT);
      

      // Process integrations if needed
      const integrationResults: IntegrationProcessResult[] = [];
      if (activeIntegrations.length > 0) {
        const activeIntegrationInstances = getIntegrationsByIds(activeIntegrations);
        
        for (const integration of activeIntegrationInstances) {
          try {
            const result = await integration.processMessage(text, {
              userId: 'current-user',
              conversationId: currentConversationId || undefined,
              messageHistory: conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            });
            integrationResults.push(result);
          } catch (error) {
            console.warn('Integration processing failed:', error);
          }
        }
      }

      // Prepare messages for API
      const optimizedMessages: UIMessage[] = [
        ...conversationHistory,
        { role: 'user', content: text },
      ];

      // Get provider token if needed
      let providerToken: string | undefined;
      if (activeIntegrations.includes('calendar')) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          providerToken = session?.provider_token || undefined;
        } catch (error) {
          console.warn('Failed to get session token:', error);
        }
      }

      // Make API call
      const chatResponse = await chatService.sendMessage({
        messages: optimizedMessages,
        conversationId: currentConversationId,
        originalInput: text,
        activeIntegrations,
        isDiagramRequest: activeIntegrations.includes('mermaid'),
        isCalendarRequest: activeIntegrations.includes('calendar'),
        integrationMode: activeIntegrations.length > 0 ? activeIntegrations[0] : null,
        providerToken,
      });

      // Handle successful response
      if (chatResponse && chatResponse.content) {
        // Update conversation ID if needed
        if (chatResponse.conversationId && !currentConversationId) {
          setCurrentConversationId(chatResponse.conversationId);
        }

        // Add assistant message
        const assistantMessage: UIMessage = {
          role: 'assistant',
          content: chatResponse.content,
        };
        
        setMessages(prev => [...prev, assistantMessage]);

        // Update conversations again after assistant response
        if (messageSentRef.current && chatResponse.conversationId) {
          messageSentRef.current(chatResponse.conversationId);
        }

        // Remove processed message from queue
        setMessageQueue(prev => prev.slice(1));
      } else {
        throw new Error('Invalid response from API');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      
      // Remove failed message from queue to prevent infinite retry
      setMessageQueue(prev => prev.slice(1));
      
      // Don't remove the user message from UI - let user see what failed
    } finally {
      setIsLoading(false);
      setIsProcessingQueue(false);
    }
  }, [messageQueue, currentConversationId, activeIntegrations]);

  // Process queue when new messages arrive
  useEffect(() => {
    if (messageQueue.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [messageQueue, isProcessingQueue, processQueue]);

  const sendMessage = useCallback(async (
    text: string,
    conversationId?: string | null
  ): Promise<void> => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }
    
    if (messageQueue.includes(trimmedText)) {
      return;
    }
    
    if (messageQueue.length >= 7) {
      return;
    }
    
    if (conversationId && !currentConversationId) {
      setCurrentConversationId(conversationId);
    }
    
    setMessageQueue(prev => [...prev, trimmedText]);
  }, [messageQueue, currentConversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setMessageQueue([]);
    setError(null);
    setCurrentConversationId(null);
  }, []);

  const removeMessageFromQueue = useCallback((index: number) => {
    setMessageQueue(prev => prev.filter((_, i) => i !== index));
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

  const toggleIntegration = useCallback((integration: IntegrationType) => {
    setActiveIntegrations(prev => {
      if (prev.includes(integration)) {
        return prev.filter(i => i !== integration);
      } else {
        return [...prev, integration];
      }
    });
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearAllData = useCallback(() => {
    setMessages([]);
    setMessageQueue([]);
    setIsLoading(false);
    setIsProcessingQueue(false);
    setError(null);
    setCurrentConversationId(null);
    setActiveIntegrations([]);
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
    clearAllData,
    activeIntegrations,
    setActiveIntegrations,
    toggleIntegration,
    clearError,
  };
};