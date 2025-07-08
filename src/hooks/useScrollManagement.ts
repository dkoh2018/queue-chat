import { useEffect, RefObject } from 'react';

interface UseScrollManagementParams {
  messages: Array<{ role: string; content: string }>;
  currentConversationId: string | null;
  chatScrollRef: RefObject<HTMLDivElement | null>;
}

export const useScrollManagement = ({
  messages,
  currentConversationId,
  chatScrollRef,
}: UseScrollManagementParams) => {
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatScrollRef.current) {
        const isNearBottom = chatScrollRef.current.scrollTop > chatScrollRef.current.scrollHeight - chatScrollRef.current.clientHeight - 100;
        if (isNearBottom) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }
    };
    
    if (messages && messages.length > 0) {
      requestAnimationFrame(scrollToBottom);
    }
  }, [messages, chatScrollRef]);

  // Save scroll position when user scrolls in any conversation
  useEffect(() => {
    const handleScroll = () => {
      if (currentConversationId && typeof window !== 'undefined' && chatScrollRef.current) {
        localStorage.setItem(`scroll-${currentConversationId}`, String(chatScrollRef.current.scrollTop));
      }
    };

    const chatContainer = chatScrollRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll);
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, [currentConversationId, chatScrollRef]);

  // Utility function to restore scroll position for a conversation
  const restoreScrollPosition = (conversationId: string) => {
    setTimeout(() => {
      if (chatScrollRef.current && typeof window !== 'undefined') {
        const savedPosition = localStorage.getItem(`scroll-${conversationId}`);
        chatScrollRef.current.scrollTop = savedPosition ? Number(savedPosition) : 0;
      }
    }, 100);
  };

  return {
    restoreScrollPosition,
  };
};
