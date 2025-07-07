'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversations, useChat, useAuth } from '@/hooks';
import { Conversation } from '@/types';
import { optimizationService } from '@/services';
import Sidebar from '@/components/features/sidebar/Sidebar';
import { ChatView } from '@/components/chat/ChatView';
import { WelcomeView } from '@/components/chat/WelcomeView';
import { MessageInput } from '@/components/chat/MessageInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { MessageQueueView } from '@/components/chat/MessageQueueView';
import { MessageInputContainer } from '@/components/chat/MessageInputContainer';
import { QueueToggle } from '@/components/features/sidebar/QueueToggle';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { MenuIcon } from '@/components/icons';

function MainChatInterface() {
  // Authentication state - STRICT: No access without authentication
  const { user, loading } = useAuth();
  
  // UI State - Default values for server rendering (consistent initial state)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [inputText, setInputText] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [newChatClicked, setNewChatClicked] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isIntegrationPopupOpen, setIsIntegrationPopupOpen] = useState(false);
  
  // Refs for better performance
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLDivElement>(null);

  // Custom Hooks for Business Logic - only load if user is authenticated or auth is required
  const {
    conversations,
    currentConversationId,
    loading: conversationsLoading,
    refreshing,
    error: conversationsError,
    isOnline,
    fetchConversations,
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
    clearAllData: clearConversationData,
    handleMessageSent,
    handleConversationSelected,
    handleConversationDeleted,
  } = useConversations();

  // **CLEAN EVENT-DRIVEN SYSTEM**: Simple event handler for message sending
  const handleChatMessageSent = useCallback((conversationId: string) => {
    // Trigger the conversation update event
    handleMessageSent(conversationId);
  }, [handleMessageSent]);

  const {
    messages,
    messageQueue,
    isProcessingQueue,
    isLoading,
    sendMessage,
    clearMessages,
    setMessages,
    removeMessageFromQueue,
    reorderQueue,
    clearAllData: clearChatData,
    activeIntegrations,
    toggleIntegration,
    error,
    clearError,
  } = useChat(handleChatMessageSent); // **CONNECTED**: Event-driven system

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatScrollRef.current) {
        const isNearBottom = chatScrollRef.current.scrollTop > chatScrollRef.current.scrollHeight - chatScrollRef.current.clientHeight - 100;
        // Only auto-scroll if user is near bottom (not manually scrolled up)
        if (isNearBottom) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
      }
    };
    
    // Scroll to bottom whenever messages change (but respect user scroll position)
    if (messages && messages.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

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
  }, [currentConversationId]);

  // **SIMPLIFIED**: Load conversations from database on mount - no complex effects
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Restore conversation state on page load
  useEffect(() => {
    if (currentConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        // **FIX**: Don't override messages during active chat processing
        // Only restore messages if we're not currently processing or loading
        // AND if there are no messages in the chat state (prevent overriding live chat)
        if (!isLoading && !isProcessingQueue && messages.length === 0) {
          const uiMessages = conversation.messages.map(msg => ({
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content
          }));
          setMessages(uiMessages);
        }
      }
    }
  }, [currentConversationId, conversations, setMessages, isLoading, isProcessingQueue, messages.length]);

  // Save sidebar state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen]);

  


  const handleNewChat = useCallback(() => {
    // Provide immediate visual feedback
    setNewChatClicked(true);
    
    // Start new conversation
    clearMessages();
    setCurrentConversationId(null);
    
    // Close sidebar on small screens after creating new chat
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
    
    // Focus the input field for better UX
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder="Ask anything"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
      // Reset the clicked state after a short delay
      setNewChatClicked(false);
    }, 150);
  }, [clearMessages, setCurrentConversationId]);

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  // Keyboard shortcuts (Cmd+K for new chat, Cmd+\ for sidebar toggle)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        handleNewChat();
      }
      if ((event.metaKey || event.ctrlKey) && event.key === '\\') {
        event.preventDefault();
        setSidebarOpen(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleNewChat]);

  // Keyboard shortcut for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (deleteModalOpen) {
          handleCancelDelete();
        } else {
          const textarea = document.querySelector('textarea[placeholder="Ask anything"]') as HTMLTextAreaElement;
          if (document.activeElement === textarea) {
            textarea.blur();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [deleteModalOpen]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText('');
    await sendMessage(text, currentConversationId);
  };

  const handleOptimize = async () => {
    const text = inputText.trim();
    if (!text || isOptimizing) return;

    const originalText = text;
    setIsOptimizing(true);
    setInputText(''); // Clear text during optimization

    try {
      const response = await optimizationService.optimizeInput({
        userInput: text,
        conversationHistory: messages,
      });
      
      // Replace the input text with optimized version
      setInputText(response.optimizedInput);
    } catch {
      // Restore original text if optimization fails
      setInputText(originalText);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSelectConversation = async (conversation: Conversation) => {
    // **EVENT**: Trigger conversation selected event
    handleConversationSelected(conversation.id);
    
    // Set current conversation in conversations hook FIRST
    selectConversation(conversation);
    
    // Defer other operations to allow UI to update first
    setTimeout(() => {
      // **SIMPLIFIED**: No complex stale data checking - just load the conversation
      const uiMessages = conversation.messages.map(msg => ({
        role: msg.role.toLowerCase() as 'user' | 'assistant',
        content: msg.content
      }));
      
      // **FIX**: Clear any pending messages and set conversation messages
      // This is safe because user intentionally switched conversations
      clearMessages(); // Clear the chat hook state first
      setMessages(uiMessages);
      
      // Restore saved scroll position for this conversation
      setTimeout(() => {
        if (chatScrollRef.current && typeof window !== 'undefined') {
          const savedPosition = localStorage.getItem(`scroll-${conversation.id}`);
          chatScrollRef.current.scrollTop = savedPosition ? Number(savedPosition) : 0;
        }
      }, 100);
    }, 0); // Defer this block
  };

  const handleDeleteClick = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    
    try {
      // **EVENT**: Trigger conversation deleted event
      handleConversationDeleted(conversationToDelete.id);
      
      await deleteConversation(conversationToDelete.id);
      
      // If we're deleting the current conversation, start a new one
      if (currentConversationId === conversationToDelete.id) {
        handleNewChat();
      }
    } catch {
      // Error handled silently - user will see UI feedback
    } finally {
      setDeleteModalOpen(false);
      setConversationToDelete(null);
    }
  };

  // Create clear all app data function for logout
  const handleClearAllAppData = useCallback(() => {
    clearConversationData();
    clearChatData();
  }, [clearConversationData, clearChatData]);

  // AUTH GUARDS: Prevent any "free mode" or temporary access
  // Show loading while auth is initializing - prevents "free mode" flash
  if (loading) {
    return <LoadingScreen />;
  }
  
  // This should never happen due to middleware, but security safety check
  if (!user) {
    return null; // No temporary access - redirect handled by middleware
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white relative overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        newChatClicked={newChatClicked}
        currentConversationId={currentConversationId}
        conversations={conversations}
        loading={conversationsLoading}
        refreshing={refreshing}
        isOnline={isOnline}
        error={conversationsError}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteClick={handleDeleteClick}
        onClearAppData={handleClearAllAppData}
      />
      

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative min-w-0 overflow-hidden">
        {/* TEMPORARILY DISABLED - Mobile backdrop overlay */}
        {/* {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 block md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )} */}
        
        {/* Floating Sidebar Toggle Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-30 p-2 bg-gray-800/60 backdrop-blur-sm rounded-lg text-white hover:bg-gray-700/60 transition-all duration-200"
            title="Open sidebar (⌘+\)"
          >
            <MenuIcon />
          </button>
        )}
        {/* Chat Area or Welcome - now takes full height */}
        {!messages || messages.length === 0 ? (
          <WelcomeView
            user={user}
          />
        ) : (
          <ChatView messages={messages} isLoading={isLoading} ref={chatScrollRef} />
        )}

        {/* Error Display - show chat errors */}
        {error && (
          <div className="fixed top-4 right-4 z-50 max-w-md">
            <div className="bg-red-900/90 backdrop-blur-sm border border-red-500/50 rounded-lg p-4 text-white shadow-lg">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-100">Message Error</h3>
                    <p className="text-sm text-red-200 mt-1">{error}</p>
                  </div>
                </div>
                <button
                  onClick={clearError}
                  className="flex-shrink-0 ml-4 text-red-400 hover:text-red-300"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed Message Input - positioned inside main content */}
        <MessageInputContainer ref={messageInputRef}>
          {/* Queue Toggle Button */}
          <QueueToggle
            isOpen={queueVisible}
            onToggle={() => setQueueVisible(!queueVisible)}
            queueCount={messageQueue.length}
          />

          {/* Queue View */}
          <MessageQueueView
            messageQueue={messageQueue}
            onRemoveMessage={removeMessageFromQueue}
            isProcessing={isProcessingQueue}
            onReorderQueue={reorderQueue}
            isVisible={queueVisible}
          />

          <MessageInput
            inputText={inputText}
            setInputText={setInputText}
            onSend={handleSend}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            onIntegrationSelect={toggleIntegration}
            activeIntegrations={activeIntegrations}
            isIntegrationPopupOpen={isIntegrationPopupOpen}
            onIntegrationPopupStateChange={setIsIntegrationPopupOpen}
            onFocus={() => {
              // Auto-close sidebar on mobile when user focuses on input
              if (typeof window !== 'undefined' && window.innerWidth < 768 && sidebarOpen) {
                setSidebarOpen(false);
              }
            }}
          />
        </MessageInputContainer>
      </div>
      
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        conversationTitle={conversationToDelete?.title || ''}
      />
    </div>
  );
}

export default function Jarvis() {
  return <MainChatInterface />;
}