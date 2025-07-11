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
    if (!chatScrollRef.current) return;

    const conversationExchanges = chatScrollRef.current.querySelectorAll('[data-conversation-exchange="true"]');

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

          // Try multiple scroll approaches for better compatibility
          const targetScrollTop = scrollHeight - containerHeight;

          // Method 1: scrollTo with smooth behavior
          scrollContainer.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });

          // Method 2: Fallback with direct scrollTop assignment after a delay
          setTimeout(() => {
            if (scrollContainer.scrollTop < targetScrollTop - 10) {
              scrollContainer.scrollTop = targetScrollTop;
            }
          }, 100);
        }
      }, 200); // Wait for animations to settle
    }
  }, [chatScrollRef]);

  // ChatGPT-like smart auto-scroll: Only scroll to bottom for new messages
  const previousMessageCountRef = useRef(0);
  const conversationIdRef = useRef<string | null>(null);
  const isLoadingConversationRef = useRef(false);
  const userScrolledAwayRef = useRef(false);

  // Track if user has scrolled away from bottom
  useEffect(() => {
    const handleScroll = () => {
      if (!chatScrollRef.current) return;
      
      const container = chatScrollRef.current;
      const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 50;
      userScrolledAwayRef.current = !isAtBottom;
    };

    const chatContainer = chatScrollRef.current;
    if (chatContainer) {
      chatContainer.addEventListener('scroll', handleScroll, { passive: true });
      return () => chatContainer.removeEventListener('scroll', handleScroll);
    }
  }, [chatScrollRef]);

  useEffect(() => {
    // Check if we're switching to a different conversation
    if (currentConversationId !== conversationIdRef.current) {
      conversationIdRef.current = currentConversationId;
      isLoadingConversationRef.current = true;
      userScrolledAwayRef.current = false; // Reset scroll state for new conversation
      
      // Reset after conversation loading completes
      setTimeout(() => {
        isLoadingConversationRef.current = false;
        previousMessageCountRef.current = messages.length;
      }, 700); // Slightly longer to ensure full loading
      
      return;
    }

    // ChatGPT-like behavior: Only auto-scroll if:
    // 1. We have messages
    // 2. We're not loading a conversation
    // 3. The message count increased (new message added)
    // 4. User hasn't scrolled away from bottom
    if (messages && 
        messages.length > 0 && 
        !isLoadingConversationRef.current && 
        messages.length > previousMessageCountRef.current &&
        !userScrolledAwayRef.current) {
      
      // Auto-scroll to bottom for new messages
      setTimeout(() => {
        scrollToLatestExchange();
      }, 300);
    }
    
    // Update the previous message count
    previousMessageCountRef.current = messages.length;
  }, [messages, currentConversationId, scrollToLatestExchange, chatScrollRef]);

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
    const timeoutRef = scrollTimeoutRef.current;
    return () => {
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }
    };
  }, []);

  // Utility function to restore scroll position for a conversation
  const restoreScrollPosition = useCallback((conversationId: string) => {
    if (!chatScrollRef.current || typeof window === 'undefined') return;
    
    const savedPosition = localStorage.getItem(`scroll-${conversationId}`);
    if (savedPosition) {
      // Add a small delay to ensure DOM is ready
      setTimeout(() => {
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = Number(savedPosition);
        }
      }, 100);
    }
  }, [chatScrollRef]);

  return {
    restoreScrollPosition,
  };
};
