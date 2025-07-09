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
  handleMessageSent: (conversationId: string, userMessage?: string) => void;
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
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    revalidateOnMount: true,
    refreshInterval: 0,
    dedupingInterval: 200,
    errorRetryCount: 2,
    errorRetryInterval: 1000,
    keepPreviousData: true,
    onSuccess: (data) => {
      logger.conversation('Conversations fetched successfully', { count: data?.length || 0 });
    },
    onError: (err) => {
      logger.error('Failed to fetch conversations', 'SWR', err);
    }
  });

  const [isOnline, setIsOnline] = useState(true);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
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

  const handleMessageSent = useCallback((conversationId: string, userMessage?: string) => {
    const existingConversation = conversations.find(c => c.id === conversationId);

    if (existingConversation) {
      // Existing conversation - do optimistic update
      optimisticallyUpdateConversationOrder(conversationId);
      // Quick refresh after optimistic update
      setTimeout(() => {
        revalidate();
      }, 500); // Reduced to 500ms for faster updates
    } else {
      const title = userMessage
        ? (userMessage.length > 50 ? userMessage.slice(0, 50) + '...' : userMessage)
        : 'New conversation...';

      const optimisticConversation: Conversation = {
        id: conversationId,
        title,
        user_id: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages: []
      };

      mutate(
        CONVERSATIONS_KEY,
        (currentData: Conversation[] | undefined) =>
          [optimisticConversation, ...(currentData || [])],
        false
      );

      setTimeout(() => {
        revalidate();
      }, 100);
    }
  }, [optimisticallyUpdateConversationOrder, revalidate, conversations]);



  const handleConversationDeleted = useCallback((conversationId: string) => {
    mutate(
      CONVERSATIONS_KEY,
      (currentData: Conversation[] | undefined) =>
        currentData?.filter(conv => conv.id !== conversationId) || [],
      false
    );
  }, []);

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
    fetchConversations: refreshConversations,
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
    clearAllData,
    handleMessageSent,
    handleConversationDeleted,
  };
};