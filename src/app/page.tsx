'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversations, useChat, useAuth } from '@/hooks';
import { Conversation } from '@/types';
import { optimizationService } from '@/services/api/optimization.service';
import { AuthGate } from '@/components/auth/AuthGate';
import Sidebar from '@/components/features/sidebar/Sidebar';
import { ChatView } from '@/components/chat/ChatView';
import { WelcomeView } from '@/components/chat/WelcomeView';
import { MessageInput } from '@/components/chat/MessageInput';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { MessageQueueView } from '@/components/chat/MessageQueueView';
import { MessageInputContainer } from '@/components/chat/MessageInputContainer';
import { QueueToggle } from '@/components/features/sidebar/QueueToggle';
import { MenuIcon } from '@/components/icons';

function MainChatInterface() {
  // Authentication state - user is guaranteed to be authenticated here
  const { user } = useAuth();
  // UI State - Default values for server rendering (consistent initial state)
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef<{ x: number, y: number } | null>(null);
  const wasDragged = useRef(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    wasDragged.current = false;
    dragStart.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    document.body.style.cursor = 'auto';
    document.body.style.userSelect = 'auto';
    if (sidebarRef.current && wasDragged.current) {
      setSidebarWidth(sidebarRef.current.offsetWidth);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isResizing && sidebarRef.current) {
      if (dragStart.current) {
        const dx = Math.abs(e.clientX - dragStart.current.x);
        const dy = Math.abs(e.clientY - dragStart.current.y);
        if (dx > 10 || dy > 10) {
          wasDragged.current = true;
        }
      }
      const newWidth = e.clientX;
      if (newWidth > 200 && newWidth < 500) {
        sidebarRef.current.style.width = `${newWidth}px`;
      }
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, handleMouseMove]);
  const [inputText, setInputText] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [newChatClicked, setNewChatClicked] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  // Refs for better performance
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Custom Hooks for Business Logic - only load if user is authenticated or auth is required
  const {
    conversations,
    currentConversationId,
    loading,
    refreshing,
    error: conversationsError,
    isOnline,
    fetchConversations,
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
    clearAllData: clearConversationData,
  } = useConversations();

  const {
    messages,
    messageQueue,
    isProcessingQueue,
    isLoading,
    sendMessage,
    clearMessages,
    setMessages,
    removeMessageFromQueue,
    clearQueue,
    reorderQueue,
    clearAllData: clearChatData,
    activeIntegrations,
    toggleIntegration,
  } = useChat(user ? fetchConversations : undefined);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    };
    
    // Scroll to bottom whenever messages change
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

  // Load conversations from database on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Restore conversation state on page load
  useEffect(() => {
    if (currentConversationId && conversations.length > 0) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation) {
        // Restore messages for the current conversation
        const uiMessages = conversation.messages.map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content
        }));
        setMessages(uiMessages);
      }
    }
  }, [currentConversationId, conversations, setMessages]);

  // Load sidebar state from localStorage after mount (client-side only)
  useEffect(() => {
    const savedSidebarOpen = localStorage.getItem('sidebarOpen');
    const savedSidebarWidth = localStorage.getItem('sidebarWidth');
    
    if (savedSidebarOpen !== null) {
      // User has a saved preference
      setSidebarOpen(JSON.parse(savedSidebarOpen));
    } else {
      // First visit - default based on screen size
      setSidebarOpen(typeof window !== 'undefined' ? window.innerWidth >= 768 : true);
    }
    
    if (savedSidebarWidth !== null) {
      setSidebarWidth(Number(savedSidebarWidth));
    } else {
      // Default responsive width
      setSidebarWidth(256);
    }
  }, []);

  // Save sidebar state changes to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
    }
  }, [sidebarOpen]);

  useEffect(() => {
    if (typeof window !== 'undefined' && sidebarWidth > 0) {
      // Only save width if it's a user-initiated change, not auto-adjustment
      if (!isResizing) {
        localStorage.setItem('sidebarWidth', String(sidebarWidth));
      }
    }
  }, [sidebarWidth, isResizing]);


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

  const handleSelectConversation = (conversation: Conversation) => {
    // Set current conversation in conversations hook FIRST
    selectConversation(conversation);
    
    // Convert database messages to UI format and load them
    const uiMessages = conversation.messages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content
    }));
    
    // Set messages in chat hook
    setMessages(uiMessages);
    
    // Restore saved scroll position for this conversation
    setTimeout(() => {
      if (chatScrollRef.current && typeof window !== 'undefined') {
        const savedPosition = localStorage.getItem(`scroll-${conversation.id}`);
        chatScrollRef.current.scrollTop = savedPosition ? Number(savedPosition) : 0;
      }
    }, 100);
  };

  const handleDeleteClick = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    
    try {
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

  return (
    <div className="flex h-screen bg-gray-900 text-white relative">
      <Sidebar
        ref={sidebarRef}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        width={sidebarWidth}
        isResizing={isResizing}
        newChatClicked={newChatClicked}
        currentConversationId={currentConversationId}
        conversations={conversations}
        loading={loading}
        refreshing={refreshing}
        isOnline={isOnline}
        error={conversationsError}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteClick={handleDeleteClick}
        onClearAppData={handleClearAllAppData}
      />
      {/* Resize handle - disabled on small screens */}
      <div
        onMouseDown={typeof window !== 'undefined' && window.innerWidth >= 768 ? handleMouseDown : undefined}
        onClick={() => {
          if (!wasDragged.current) {
            const newOpenState = !sidebarOpen;
            if (newOpenState && sidebarWidth === 0) {
              setSidebarWidth(256); // Restore to default width if it was 0
            }
            setSidebarOpen(newOpenState);
          }
        }}
        className="group w-2 bg-gray-800/50 hover:bg-gray-700/70 transition-colors duration-200 flex items-center justify-center cursor-col-resize"
      >
        <div className="w-1 h-8 bg-gray-600 rounded-full transition-opacity duration-300" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
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
            currentConversationId={currentConversationId}
            user={user}
            authLoading={false}
          />
        ) : (
          <ChatView messages={messages} isLoading={isLoading} ref={chatScrollRef} />
        )}

        {/* Fixed Message Input - positioned inside main content */}
        <MessageInputContainer>
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
            onClearQueue={clearQueue}
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
  return (
    <AuthGate>
      <MainChatInterface />
    </AuthGate>
  );
}