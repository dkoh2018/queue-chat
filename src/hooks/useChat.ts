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
  removeMessageFromQueue: (message: string) => void;
  clearAllData: () => void;
  activeIntegrations: IntegrationType[];
  setActiveIntegrations: (integrations: IntegrationType[]) => void;
  toggleIntegration: (integration: IntegrationType) => void;
  clearError: () => void;
}

export const useChat = (
  onMessageSent?: (conversationId: string, userMessage?: string) => void,
  currentConversationId?: string | null,
  setCurrentConversationId?: (id: string | null) => void,
  customSystemInstructions?: string
): UseChatReturn => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [internalConversationId, setInternalConversationId] = useState<string | null>(null);
  const conversationId = currentConversationId ?? internalConversationId;
  const setConversationId = setCurrentConversationId ?? setInternalConversationId;
  const [activeIntegrations, setActiveIntegrations] = useState<IntegrationType[]>([]);

  const messagesRef = useRef<UIMessage[]>([]);
  const messageQueueRef = useRef<string[]>([]);
  const processingRef = useRef<boolean>(false);
  const messageSentRef = useRef<((conversationId: string, userMessage?: string) => void) | undefined>(onMessageSent);

  useTokenRefresh();
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    messageQueueRef.current = messageQueue;
  }, [messageQueue]);

  useEffect(() => {
    processingRef.current = isProcessingQueue;
  }, [isProcessingQueue]);

  useEffect(() => {
    messageSentRef.current = onMessageSent;
  }, [onMessageSent]);

  const processQueue = useCallback(async () => {
    if (processingRef.current || messageQueueRef.current.length === 0) {
      return;
    }

    processingRef.current = true;
    setIsProcessingQueue(true);

    const text = messageQueueRef.current[0];
    if (!text?.trim()) {
      setMessageQueue(prev => prev.slice(1));
      processingRef.current = false;
      setIsProcessingQueue(false);
      return;
    }

    setError(null);

    try {
      // Call onMessageSent for immediate optimistic updates (works for both existing and new conversations)
      if (messageSentRef.current && conversationId) {
        messageSentRef.current(conversationId, text);
      }

      const userMessage: UIMessage = { role: 'user', content: text };

      setMessages(prev => {
        const newMessages = [...prev, userMessage];
        messagesRef.current = newMessages;
        return newMessages;
      });

      setIsLoading(true);

      const currentMessages = [...messagesRef.current];
      const conversationHistory = currentMessages.slice(-UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT);
      

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

      const optimizedMessages: UIMessage[] = [
        ...conversationHistory,
        { role: 'user', content: text },
      ];

      let providerToken: string | undefined;
      if (activeIntegrations.includes('calendar')) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          providerToken = session?.provider_token || undefined;
          if (!providerToken) {
            console.warn('Calendar integration requires Google OAuth token');
          }
        } catch (error) {
          console.warn('Failed to get session token for calendar integration:', error);
        }
      }
      console.log('🚀 Sending message to chat API with custom instructions:', {
        hasCustomInstructions: !!customSystemInstructions,
        instructionsLength: customSystemInstructions?.length || 0,
        instructionsPreview: customSystemInstructions?.slice(0, 50) + '...'
      });

      const chatResponse = await chatService.sendMessage({
        messages: optimizedMessages,
        conversationId: conversationId,
        originalInput: text,
        activeIntegrations,
        isDiagramRequest: activeIntegrations.includes('mermaid'),
        isCalendarRequest: activeIntegrations.includes('calendar'),
        integrationMode: activeIntegrations.length > 0 ? activeIntegrations[0] : null,
        providerToken,
        customSystemInstructions,
      });

      // Handle successful response
      if (chatResponse && chatResponse.content) {
        // Update conversation ID if needed (for new conversations)
        if (chatResponse.conversationId && !conversationId) {
          setConversationId(chatResponse.conversationId);
        }

        const assistantMessage: UIMessage = {
          role: 'assistant',
          content: chatResponse.content,
        };

        setMessages(prev => {
          const newMessages = [...prev, assistantMessage];
          messagesRef.current = newMessages;
          return newMessages;
        });

        if (messageSentRef.current && chatResponse.conversationId) {
          messageSentRef.current(chatResponse.conversationId, text);
        }
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
      processingRef.current = false;
    }
  }, [currentConversationId, activeIntegrations, conversationId, setConversationId]);

  useEffect(() => {
    if (messageQueue.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [messageQueue, isProcessingQueue, processQueue]);

  const sendMessage = useCallback(async (
    text: string,
    targetConversationId?: string | null
  ): Promise<void> => {
    const trimmedText = text.trim();
    if (!trimmedText) {
      return;
    }

    if (messageQueue.includes(trimmedText) || messageQueueRef.current.includes(trimmedText)) {
      return;
    }

    if (messageQueue.length >= 5 || messageQueueRef.current.length >= 5) {
      return;
    }

    if (targetConversationId && !conversationId) {
      setConversationId(targetConversationId);
    }
    
    setMessageQueue(prev => [...prev, trimmedText]);
  }, [messageQueue, conversationId, setConversationId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setMessageQueue([]);
    setError(null);
    setConversationId(null);
  }, [setConversationId]);

  const removeMessageFromQueue = useCallback((message: string) => {
    setMessageQueue(prev => prev.filter(msg => msg !== message));
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
    setCurrentConversationId?.(null);
    setActiveIntegrations([]);
  }, [setCurrentConversationId]);

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
    clearAllData,
    activeIntegrations,
    setActiveIntegrations,
    toggleIntegration,
    clearError,
  };
};