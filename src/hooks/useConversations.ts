import { useState, useEffect, useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import { Conversation } from '@/types';
import { conversationsService } from '@/services';
import { logger } from '@/utils';

interface UseConversationsReturn {
  conversations: Conversation[];
  currentConversationId: string | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isOnline: boolean;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;
  clearAllData: () => void;
  handleMessageSent: (conversationId: string) => void;
  handleConversationSelected: (conversationId: string) => void;
  handleConversationDeleted: (conversationId: string) => void;
}

const CONVERSATIONS_KEY = '/api/conversations';

export const useConversations = (): UseConversationsReturn => {
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  
  // SWR for smart caching and data fetching
  const { 
    data: conversations = [], 
    error, 
    isLoading: loading, 
    isValidating: refreshing,
    mutate: revalidate 
  } = useSWR(CONVERSATIONS_KEY, conversationsService.getConversations, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    revalidateOnMount: true,
    refreshInterval: 0,
    dedupingInterval: 3000, // **CLEAN**: Reasonable deduping interval
    errorRetryCount: 1,
    errorRetryInterval: 2000,
    onSuccess: (data) => {
      logger.conversation('Conversations fetched successfully', { count: data?.length || 0 });
    },
    onError: (err) => {
      logger.error('Failed to fetch conversations', 'SWR', err);
    }
  });

  // Detect online/offline status
  const [isOnline, setIsOnline] = useState(true);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        localStorage.setItem('currentConversationId', conversation.id);
      }, 0);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await conversationsService.deleteConversation(conversationId);
      
      // Optimistic update: remove from cache immediately
      await mutate(
        CONVERSATIONS_KEY,
        (currentData: Conversation[] | undefined) => 
          currentData?.filter(conv => conv.id !== conversationId) || [],
        false
      );
      
      // Clear current conversation if it was deleted
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentConversationId');
        }
      }
      
      logger.conversation('Conversation deleted', { conversationId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      logger.error('Failed to delete conversation', 'CONVERSATION', err);
      // Revalidate to restore correct state
      await revalidate();
      throw new Error(errorMessage);
    }
  }, [currentConversationId, revalidate]);

  // Online/offline detection - simplified
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Don't auto-revalidate on reconnect to prevent spam
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load currentConversationId from localStorage after mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConversationId = localStorage.getItem('currentConversationId');
      if (savedConversationId) {
        setCurrentConversationId(savedConversationId);
      }
    }
  }, []);

  // Save to localStorage when currentConversationId changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentConversationId) {
        localStorage.setItem('currentConversationId', currentConversationId);
      } else {
        localStorage.removeItem('currentConversationId');
      }
    }
  }, [currentConversationId]);

  // Clear all conversation data (for logout)
  const clearAllData = useCallback(() => {
    // Clear SWR cache
    mutate(CONVERSATIONS_KEY, [], false);
    
    // Clear current conversation
    setCurrentConversationId(null);
    
    // Clear localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentConversationId');
      // Clear all scroll positions
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('scroll-')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    logger.info('All conversation data cleared', 'CONVERSATION');
  }, []);

  // **CLEAN**: Optimistic update for conversation ordering
  const optimisticallyUpdateConversationOrder = useCallback((conversationId: string) => {
    // Move the conversation to the top immediately with better performance
    mutate(
      CONVERSATIONS_KEY,
      (currentData: Conversation[] | undefined) => {
        if (!currentData || currentData.length === 0) return currentData;
        
        const conversationIndex = currentData.findIndex(c => c.id === conversationId);
        
        if (conversationIndex >= 0) {
          // **OPTIMIZED**: Create new array efficiently
          const conversation = { ...currentData[conversationIndex] };
          conversation.updatedAt = new Date().toISOString();
          
          const updatedConversations = [
            conversation, // Move to top
            ...currentData.slice(0, conversationIndex), // Before target
            ...currentData.slice(conversationIndex + 1) // After target
          ];
          
          return updatedConversations;
        }
        
        return currentData;
      },
      {
        revalidate: false, // Skip server round trip
        populateCache: true // Update cache immediately
      }
    );
  }, []);

  // **NEW EVENT-DRIVEN SYSTEM**: Specific handlers for different events
  const handleMessageSent = useCallback((conversationId: string) => {
    // **FIX**: Only do optimistic update, skip excessive revalidation
    // The server will handle persistence, we just need UI feedback
    optimisticallyUpdateConversationOrder(conversationId);
    
    // **REDUCED**: Single revalidation after longer delay to prevent cascading
    setTimeout(() => {
      revalidate();
    }, 5000); // Wait 5 seconds to ensure all processing is done
  }, [optimisticallyUpdateConversationOrder, revalidate]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleConversationSelected = useCallback((conversationId: string) => {
    // Only refresh if the data might be stale (user was actively messaging)
    // No automatic refresh - let user trigger if needed
  }, []);

  const handleConversationDeleted = useCallback((conversationId: string) => {
    // Immediate cache update - no server call needed
    mutate(
      CONVERSATIONS_KEY,
      (currentData: Conversation[] | undefined) => 
        currentData?.filter(conv => conv.id !== conversationId) || [],
      false
    );
  }, []);

  // **SIMPLIFIED**: Manual refresh only when explicitly requested
  const refreshConversations = useCallback(async () => {
    await revalidate();
  }, [revalidate]);

  return {
    conversations,
    currentConversationId,
    loading,
    refreshing,
    error: error?.message || null,
    isOnline,
    fetchConversations: refreshConversations, // Rename for clarity
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
    clearAllData,
    // **NEW EVENT HANDLERS**
    handleMessageSent,
    handleConversationSelected,
    handleConversationDeleted,
  };
};