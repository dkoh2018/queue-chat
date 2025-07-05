import { useState, useCallback, useEffect } from 'react';
import { UIMessage, IntegrationType } from '@/types';
import { chatService } from '@/services';
import { UI_CONSTANTS } from '@/utils';
import { getIntegrationsByIds, IntegrationProcessResult } from '@/integrations';

// Helper function to log to server terminal
const logToServer = async (message: string, data?: unknown) => {
  try {
    await fetch('/api/debug-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, data })
    });
  } catch {
    // Silently fail - don't break the app for logging
  }
};

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
}

export const useChat = (onConversationUpdate?: () => void): UseChatReturn => {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [messageQueue, setMessageQueue] = useState<string[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  
  // REQUEST LIMITING SAFEGUARDS
  const [activeRequests, setActiveRequests] = useState<number>(0);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [requestHistory, setRequestHistory] = useState<string[]>([]);
  
  const MAX_CONCURRENT_REQUESTS = 5;
  const MIN_REQUEST_INTERVAL = 1000; // 1 second between requests
  const MAX_DUPLICATE_REQUESTS = 3; // Max same request in history
  const [activeIntegrations, setActiveIntegrations] = useState<IntegrationType[]>(() => {
    // Load saved integrations from localStorage on initialization
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('activeIntegrations');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  // Save active integrations to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('activeIntegrations', JSON.stringify(activeIntegrations));
    }
  }, [activeIntegrations]);

  const processQueue = useCallback(async () => {
    if (isProcessingQueue || messageQueue.length === 0) {
      return;
    }

    const text = messageQueue[0];
    
    // ENHANCED SAFEGUARDS
    // 1. Prevent duplicate processing
    if (processingMessage === text) {
      return;
    }

    // 2. Check concurrent request limit
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      return;
    }

    // 3. Rate limiting - prevent rapid fire requests
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
      setTimeout(() => processQueue(), MIN_REQUEST_INTERVAL - (now - lastRequestTime));
      return;
    }

    // 4. Check for excessive duplicate requests
    const duplicateCount = requestHistory.filter(req => req === text).length;
    if (duplicateCount >= MAX_DUPLICATE_REQUESTS) {
      setMessageQueue(prev => prev.slice(1));
      setError(`Request blocked: Too many identical requests for "${text.slice(0, 50)}..."`);
      return;
    }

    setIsProcessingQueue(true);
    setProcessingMessage(text);
    setActiveRequests(prev => prev + 1);
    setLastRequestTime(now);
    
    // Add to request history (keep last 10)
    setRequestHistory(prev => [...prev.slice(-9), text]);

    try {
      setIsLoading(true);
      setError(null);

      const userMessage: UIMessage = { role: 'user', content: text };
      
      // ENHANCED CONVERSATION HISTORY: Use current messages state to avoid stale closure
      // This guarantees both user and assistant messages are included in context
      const allMessages = [...messages, userMessage];
      const conversationHistory = allMessages.slice(-UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT);
      
      // Add user message to state AFTER we've calculated conversation history
      setMessages(prev => [...prev, userMessage]);
      
      // Log conversation history to server terminal
      logToServer('Conversation history prepared:', {
        totalMessages: allMessages.length,
        historyLength: conversationHistory.length,
        historyLimit: UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT,
        userMessages: conversationHistory.filter(m => m.role === 'user').length,
        assistantMessages: conversationHistory.filter(m => m.role === 'assistant').length
      });
      

      const integrationResults: IntegrationProcessResult[] = [];

      // Process with active integrations
      if (activeIntegrations.length > 0) {
        // Get active integrations and process the message
        const activeIntegrationInstances = getIntegrationsByIds(activeIntegrations);
        
        // Process message with each active integration
        for (const integration of activeIntegrationInstances) {
          try {
            const result = await integration.processMessage(text, {
              userId: 'current-user', // TODO: Get actual user ID
              conversationId: currentConversationId || undefined,
              messageHistory: conversationHistory.map(msg => ({
                role: msg.role,
                content: msg.content
              }))
            });
            integrationResults.push(result);
          } catch {
            // Integration error handled silently
          }
        }
      }

      const optimizedMessages: UIMessage[] = [
        ...conversationHistory,
        { role: 'user', content: text },
      ];

      let chatResponse;
      
      try {
        chatResponse = await chatService.sendMessage({
          messages: optimizedMessages,
          conversationId: currentConversationId,
          // NEW: Send active integrations directly
          activeIntegrations,
          // Keep backward compatibility with existing API
          isDiagramRequest: activeIntegrations.includes('mermaid'),
          isCalendarRequest: activeIntegrations.includes('calendar'),
          integrationMode: activeIntegrations.length > 0 ? activeIntegrations[0] : null,
        });
      } catch (apiError) {
        // API call failed - remove user message since it wasn't processed
        setMessages(prev => prev.slice(0, -1));
        throw apiError;
      }

      // API call succeeded - now process the response
      try {
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
        setMessageQueue(prev => prev.slice(1));
      } catch {
        // Response processing failed, but API succeeded - keep user message, show error
        setError('Failed to process response, but your message was sent');
        setMessageQueue(prev => prev.slice(1));
      }
    } catch (err) {
      // This catch block now only handles API call failures (user message already removed above)
      // or other unexpected errors - don't remove user message here as it may have been processed
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
      setIsProcessingQueue(false);
      setProcessingMessage(null);
      setActiveRequests(prev => Math.max(0, prev - 1)); // Decrement active requests
    }
  }, [isProcessingQueue, messageQueue, messages, onConversationUpdate, currentConversationId, processingMessage, activeIntegrations, activeRequests, lastRequestTime, requestHistory]);

  useEffect(() => {
    if (messageQueue.length > 0 && !isProcessingQueue) {
      processQueue();
    }
  }, [messageQueue, isProcessingQueue, processQueue]);

  const sendMessage = useCallback(async (
    text: string,
    conversationId?: string | null
  ): Promise<void> => {
    if (!text.trim()) {
      return;
    }
    
    // ENHANCED DUPLICATE PREVENTION
    const trimmedText = text.trim();
    
    // Check if message is already in queue or being processed
    if (messageQueue.includes(trimmedText) || processingMessage === trimmedText) {
      return;
    }
    
    // Check recent message history to prevent rapid duplicates
    const recentDuplicates = requestHistory.filter(req => req === trimmedText).length;
    if (recentDuplicates >= 2) {
      setError(`Message blocked: Too many recent identical requests`);
      return;
    }
    
    // Check queue size limit
    if (messageQueue.length >= 10) {
      setMessageQueue(prev => prev.slice(1));
    }
    
    if (conversationId && !currentConversationId) {
      setCurrentConversationId(conversationId);
    }
    
    
    setMessageQueue(prev => [...prev, trimmedText]);
    
    // Log message added to queue to server terminal
    logToServer('Message added to queue:', {
      message: trimmedText.slice(0, 50) + (trimmedText.length > 50 ? '...' : ''),
      queueLength: messageQueue.length + 1,
      activeRequests
    });
  }, [currentConversationId, messageQueue, processingMessage, requestHistory, activeRequests]);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setMessageQueue([]);
    setError(null);
    setCurrentConversationId(null);
  }, []);

  const removeMessageFromQueue = useCallback((index: number) => {
    setMessageQueue(prev => {
      const newQueue = prev.filter((_, i) => i !== index);
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

  // Toggle integration function
  const toggleIntegration = useCallback((integration: IntegrationType) => {
    setActiveIntegrations(prev => {
      if (prev.includes(integration)) {
        // Remove if already active
        return prev.filter(i => i !== integration);
      } else {
        // Add if not active
        return [...prev, integration];
      }
    });
  }, []);

  // Clear all chat data (for logout)
  const clearAllData = useCallback(() => {
    setMessages([]);
    setMessageQueue([]);
    setIsLoading(false);
    setIsProcessingQueue(false);
    setError(null);
    setCurrentConversationId(null);
    setProcessingMessage(null);
    setActiveIntegrations([]);
    
    // Clear request limiting state
    setActiveRequests(0);
    setLastRequestTime(0);
    setRequestHistory([]);
    
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
  };
};