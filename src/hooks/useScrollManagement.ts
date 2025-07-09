import { useEffect, RefObject, useCallback, useRef } from 'react';

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
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simplified scroll function that works with animations
  const scrollToLatestExchange = useCallback(() => {
    if (!chatScrollRef.current) {
      console.log('ScrollManagement: chatScrollRef.current is null');
      return;
    }

    console.log('ScrollManagement: Attempting to scroll, container:', chatScrollRef.current);

    const conversationExchanges = chatScrollRef.current.querySelectorAll('[data-conversation-exchange="true"]');
    console.log('ScrollManagement: Found exchanges:', conversationExchanges.length);

    if (conversationExchanges.length > 0) {
      const latestExchange = conversationExchanges[conversationExchanges.length - 1];

      // Use scrollIntoView with a delay to let animations settle
      setTimeout(() => {
        if (latestExchange && chatScrollRef.current) {
          // For ChatGPT/Grok-like experience: scroll to the very bottom
          // This ensures the latest message is fully visible at the bottom
          const scrollContainer = chatScrollRef.current;
          const scrollHeight = scrollContainer.scrollHeight;
          const containerHeight = scrollContainer.clientHeight;

          console.log('ScrollManagement: Scrolling - scrollHeight:', scrollHeight, 'containerHeight:', containerHeight);

          // Try multiple scroll approaches for better compatibility
          const targetScrollTop = scrollHeight - containerHeight;
          console.log('ScrollManagement: Target scroll position:', targetScrollTop);

          // Method 1: scrollTo with smooth behavior
          scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });

          // Method 2: Fallback with direct scrollTop assignment after a delay
          setTimeout(() => {
            if (scrollContainer.scrollTop < targetScrollTop - 10) {
              console.log('ScrollManagement: Fallback scroll - current:', scrollContainer.scrollTop, 'target:', targetScrollTop);
              scrollContainer.scrollTop = targetScrollTop;
            }
          }, 100);
        }
      }, 200); // Wait for animations to settle
    }
  }, [chatScrollRef]);

  // Auto-scroll with ChatGPT/Grok "push up" behavior - newest exchange ALWAYS appears at top
  useEffect(() => {
    // Trigger scroll for every message change - no conditions needed
    if (messages && messages.length > 0) {
      // Use a longer delay to ensure DOM is fully updated and animations are settled
      setTimeout(() => {
        scrollToLatestExchange();
      }, 300);
    }
  }, [messages, scrollToLatestExchange]);

  // Save scroll position when user scrolls in any conversation
  useEffect(() => {
    const handleScroll = () => {
      if (currentConversationId && typeof window !== 'undefined' && chatScrollRef.current) {
        localStorage.setItem(`scroll-${currentConversationId}`, String(chatScrollRef.current.scrollTop));
      }
    };

    const chatContainer = chatScrollRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, [currentConversationId, chatScrollRef]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Utility function to restore scroll position for a conversation
  const restoreScrollPosition = useCallback((conversationId: string) => {
    if (!chatScrollRef.current || typeof window === 'undefined') return;
    
    const savedPosition = localStorage.getItem(`scroll-${conversationId}`);
    if (savedPosition) {
      chatScrollRef.current.scrollTop = Number(savedPosition);
    }
  }, [chatScrollRef]);

  return {
    restoreScrollPosition,
  };
};
