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
  
  const { 
    data: conversations = [], 
    error, 
    isLoading: loading, 
    isValidating: refreshing,
    mutate: revalidate 
  } = useSWR(CONVERSATIONS_KEY, conversationsService.getConversations, {
    revalidateOnFocus: false, // Don't refresh on focus - causes selection lag
    revalidateOnReconnect: true, // Keep reconnect refresh
    revalidateOnMount: true, // Keep mount refresh
    refreshInterval: 0, // No automatic polling
    dedupingInterval: 1000, // Increase to reduce duplicate requests
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    keepPreviousData: true, // Show old data while loading new data
    onSuccess: (data) => {
      logger.conversation('Conversations fetched successfully', { count: data?.length || 0 });
    },
    onError: (err) => {
      logger.error('Failed to fetch conversations', 'SWR', err);
    }
  });

  const [isOnline, setIsOnline] = useState(true);

  const selectConversation = useCallback((conversation: Conversation) => {
    // Only handle localStorage - state is updated by the caller
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentConversationId', conversation.id);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await conversationsService.deleteConversation(conversationId);
      
      await mutate(
        CONVERSATIONS_KEY,
        (currentData: Conversation[] | undefined) => 
          currentData?.filter(conv => conv.id !== conversationId) || [],
        false
      );
      
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
      await revalidate();
      throw new Error(errorMessage);
    }
  }, [currentConversationId, revalidate]);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConversationId = localStorage.getItem('currentConversationId');
      if (savedConversationId) {
        setCurrentConversationId(savedConversationId);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (currentConversationId) {
        localStorage.setItem('currentConversationId', currentConversationId);
      } else {
        localStorage.removeItem('currentConversationId');
      }
    }
  }, [currentConversationId]);

  const clearAllData = useCallback(() => {
    mutate(CONVERSATIONS_KEY, [], false);
    
    setCurrentConversationId(null);
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentConversationId');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('scroll-')) {
          localStorage.removeItem(key);
        }
      });
    }
    
    logger.info('All conversation data cleared', 'CONVERSATION');
  }, []);

  const optimisticallyUpdateConversationOrder = useCallback((conversationId: string) => {
    mutate(
      CONVERSATIONS_KEY,
      (currentData: Conversation[] | undefined) => {
        if (!currentData || currentData.length === 0) return currentData;
        
        const conversationIndex = currentData.findIndex(c => c.id === conversationId);
        
        if (conversationIndex >= 0) {
          const conversation = { ...currentData[conversationIndex] };
          conversation.updatedAt = new Date().toISOString();
          
          const updatedConversations = [
            conversation,
            ...currentData.slice(0, conversationIndex),
            ...currentData.slice(conversationIndex + 1)
          ];
          
          return updatedConversations;
        }
        
        return currentData;
      },
      {
        revalidate: false,
        populateCache: true
      }
    );
  }, []);

  const handleMessageSent = useCallback((conversationId: string) => {
    // For new conversations that aren't in the cache yet, immediately refresh
    // For existing conversations, do optimistic update then refresh
    const existingConversation = conversations.find(c => c.id === conversationId);
    
    if (existingConversation) {
      // Existing conversation - do optimistic update
      optimisticallyUpdateConversationOrder(conversationId);
      // Quick refresh after optimistic update
      setTimeout(() => {
        revalidate();
      }, 1000); // Reduced from 5000ms to 1000ms
    } else {
      // New conversation - immediately refresh to show it in the sidebar
      revalidate();
    }
  }, [optimisticallyUpdateConversationOrder, revalidate, conversations]);

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