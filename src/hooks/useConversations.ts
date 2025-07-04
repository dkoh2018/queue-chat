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
    revalidateOnFocus: false, // Stop aggressive revalidation
    revalidateOnReconnect: false, // Stop reconnection spam
    revalidateOnMount: true,
    refreshInterval: 0,
    dedupingInterval: 10000, // Increase deduping interval
    errorRetryCount: 1, // Reduce retry attempts
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

  const fetchConversations = useCallback(async () => {
    await revalidate();
  }, [revalidate]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentConversationId', conversation.id);
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

  return {
    conversations,
    currentConversationId,
    loading,
    refreshing,
    error: error?.message || null,
    isOnline,
    fetchConversations,
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
  };
};