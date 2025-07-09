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
  // Auto-scroll with ChatGPT/Grok "push up" behavior - newest exchange appears at top
  useEffect(() => {
    const scrollToLatestExchange = () => {
      if (chatScrollRef.current) {
        // Find all conversation exchanges using the data attribute
        const conversationExchanges = chatScrollRef.current.querySelectorAll('[data-conversation-exchange="true"]');
        
        console.log('🔍 Scroll Debug:', {
          exchangeCount: conversationExchanges.length,
          messagesLength: messages.length,
          scrollContainer: !!chatScrollRef.current
        });
        
        if (conversationExchanges.length > 0) {
          const latestExchange = conversationExchanges[conversationExchanges.length - 1];
          console.log('📍 Scrolling to latest exchange:', latestExchange);
          
          // Push conversation up so newest exchange appears at top of viewport
          latestExchange.scrollIntoView({ behavior: 'smooth', block: 'start' });
          
          // Add small offset for better visual positioning
          setTimeout(() => {
            if (chatScrollRef.current) {
              chatScrollRef.current.scrollTop = Math.max(0, chatScrollRef.current.scrollTop - 20);
            }
          }, 300);
        } else {
          console.log('⚠️ No exchanges found, scrolling to bottom');
          // Fallback: scroll to bottom
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }
    };
    
    if (messages && messages.length > 0) {
      console.log('🚀 Triggering scroll for messages:', messages.length);
      // Use a longer delay to ensure DOM is fully updated
      setTimeout(() => {
        requestAnimationFrame(scrollToLatestExchange);
      }, 100);
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
