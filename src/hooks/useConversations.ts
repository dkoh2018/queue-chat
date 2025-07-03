import { useState, useEffect, useCallback } from 'react';
import { Conversation } from '@/types';
import { conversationsService } from '@/services';

interface UseConversationsReturn {
  conversations: Conversation[];
  currentConversationId: string | null;
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  selectConversation: (conversation: Conversation) => void;
  deleteConversation: (conversationId: string) => Promise<void>;
  setCurrentConversationId: (id: string | null) => void;
}

export const useConversations = (): UseConversationsReturn => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('🔍 Fetching conversations from database...');
      
      const data = await conversationsService.getConversations();
      console.log('💾 Conversations data received:', data);
      console.log('📊 Number of conversations:', data?.length || 0);
      
      setConversations(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversations';
      console.error('❌ Failed to fetch conversations:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

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
    error,
    fetchConversations,
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
  };
};