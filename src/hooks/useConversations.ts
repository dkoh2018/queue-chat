import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@/types';
import { conversationsService } from '@/services';

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

export const useConversations = (): UseConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState<number>(Date.now());

  const fetchConversations = useCallback(async (isRefresh = false) => {
    if (!isOnline) {
      console.log('📴 Offline - skipping fetch');
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      console.log('🔍 Fetching conversations from database...');
      
      const data = await conversationsService.getConversations();
      console.log('💾 Conversations data received:', data);
      console.log('📊 Number of conversations:', data?.length || 0);
      
      setConversations(data);
      setLastFetchTime(Date.now());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      console.error('❌ Failed to fetch conversations:', err);
      
      // Check if it's a network error
      if (err instanceof Error && (err.message.includes('fetch') || err.message.includes('network'))) {
        setIsOnline(false);
        setError('Connection lost. Using cached data.');
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isOnline]);

  const selectConversation = useCallback((conversation: Conversation) => {
    setCurrentConversationId(conversation.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('currentConversationId', conversation.id);
    }
  }, []);

  const deleteConversation = useCallback(async (conversationId: string) => {
    try {
      await conversationsService.deleteConversation(conversationId);
      
      // Remove from local state
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));
      
      // Clear current conversation if it was deleted
      if (currentConversationId === conversationId) {
        setCurrentConversationId(null);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('currentConversationId');
        }
      }
      
      console.log('🗑️ Conversation deleted:', conversationId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete conversation';
      console.error('❌ Failed to delete conversation:', err);
      throw new Error(errorMessage);
    }
  }, [currentConversationId]);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Auto-refresh conversations for multi-device sync
  useEffect(() => {
    const handleVisibilityChange = () => {
      // When user returns to app (switching devices), refresh if data is stale
      if (!document.hidden && Date.now() - lastFetchTime > 30000) { // 30 seconds
        console.log('🔄 Auto-refreshing conversations after device switch');
        fetchConversations(true);
      }
    };

    const handleFocus = () => {
      // When app gets focus, refresh if data is stale
      if (Date.now() - lastFetchTime > 30000) {
        console.log('🔄 Auto-refreshing conversations on focus');
        fetchConversations(true);
      }
    };

    // Auto-refresh every 2 minutes when app is active
    const interval = setInterval(() => {
      if (!document.hidden && Date.now() - lastFetchTime > 120000) { // 2 minutes
        console.log('🔄 Periodic auto-refresh of conversations');
        fetchConversations(true);
      }
    }, 60000); // Check every minute

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      clearInterval(interval);
    };
  }, [fetchConversations, lastFetchTime]);

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => {
      console.log('🟢 Back online - refreshing conversations');
      setIsOnline(true);
      setError(null);
      fetchConversations(true);
    };

    const handleOffline = () => {
      console.log('🔴 Gone offline - will use cached data');
      setIsOnline(false);
      setError('Connection lost. Using cached data.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [fetchConversations]);

  // Load currentConversationId from localStorage after mount (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedConversationId = localStorage.getItem('currentConversationId');
      if (savedConversationId) {
        setCurrentConversationId(savedConversationId);
      }
    }
  }, []);

  // Save to localStorage when currentConversationId changes (but not on initial mount)
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
    error,
    isOnline,
    fetchConversations,
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
  };
};