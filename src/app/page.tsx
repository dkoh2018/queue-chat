'use client';

import { useState, useEffect, useRef } from 'react';
import { useConversations, useChat } from '@/hooks';
import { Conversation } from '@/types';
import Sidebar from '@/components/Sidebar';
import { ChatView } from '@/components/ChatView';
import { WelcomeView } from '@/components/WelcomeView';
import { MessageInput } from '@/components/MessageInput';
import { ConfirmationModal } from '@/components/ConfirmationModal';
import { MessageQueueView } from '@/components/MessageQueueView';
import { MessageInputContainer } from '@/components/MessageInputContainer';
import { QueueToggle } from '@/components/QueueToggle';
import { MenuIcon } from '@/components/icons';

export default function Jarvis() {
  // UI State - Start with sidebar closed on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  const handleMouseMove = (e: MouseEvent) => {
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
  };

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
  }, [isResizing]);
  const [inputText, setInputText] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [newChatClicked, setNewChatClicked] = useState(false);
  const [queueVisible, setQueueVisible] = useState(false);

  // Custom Hooks for Business Logic (must come before any useEffect that uses their values)
  const {
    conversations,
    currentConversationId,
    loading,
    fetchConversations,
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
  } = useConversations();

  const {
    messages,
    messageQueue,
    isProcessingQueue,
    sendMessage,
    clearMessages,
    setMessages,
    removeMessageFromQueue,
    clearQueue,
    reorderQueue,
  } = useChat(fetchConversations);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    const scrollToBottom = () => {
      const chatContainer = document.querySelector('.chat-scroll');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    };
    
    // Scroll to bottom whenever messages change (with null safety)
    if (messages && messages.length > 0) {
      // Use setTimeout to ensure DOM is updated
      setTimeout(scrollToBottom, 100);
    }
  }, [messages]);

  // Load conversations from database on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Handle responsive sidebar behavior
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        // Desktop: open sidebar by default
        setSidebarOpen(true);
      } else {
        // Mobile: close sidebar by default
        setSidebarOpen(false);
      }
    };

    // Set initial state based on screen size
    handleResize();
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleNewChat = () => {
    // Provide immediate visual feedback
    setNewChatClicked(true);
    
    // Start new conversation
    clearMessages();
    setCurrentConversationId(null);
    
    // Close sidebar on mobile after creating new chat
    if (window.innerWidth < 768) {
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
  };

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  // Keyboard shortcut for new chat (Cmd+K)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === 'k') {
        event.preventDefault();
        handleNewChat();
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

  const handleSelectConversation = (conversation: Conversation) => {
    // Convert database messages to UI format and load them
    const uiMessages = conversation.messages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content
    }));
    
    // Set messages in chat hook
    setMessages(uiMessages);
    
    // Set current conversation in conversations hook
    selectConversation(conversation);
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
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setDeleteModalOpen(false);
      setConversationToDelete(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-900 text-white relative">
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
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteClick={handleDeleteClick}
      />
      <div
        onMouseDown={handleMouseDown}
        onClick={() => {
          if (!wasDragged.current) {
            const newOpenState = !sidebarOpen;
            if (newOpenState && sidebarWidth === 0) {
              setSidebarWidth(256); // Restore to default width if it was 0
            }
            setSidebarOpen(newOpenState);
          }
        }}
        className="group w-2 cursor-col-resize bg-gray-800/50 hover:bg-gray-700/70 transition-colors duration-200 flex items-center justify-center hidden md:flex"
      >
        <div className="w-1 h-8 bg-gray-600 rounded-full transition-opacity duration-300" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Floating Sidebar Toggle Button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="fixed top-4 left-4 z-50 p-2 bg-gray-800/50 rounded-full text-white hover:bg-gray-700/70 backdrop-blur-sm transition-all duration-300"
            title="Open sidebar"
          >
            <MenuIcon />
          </button>
        )}
        {/* Chat Area or Welcome - now takes full height */}
        {!messages || messages.length === 0 ? (
          <WelcomeView currentConversationId={currentConversationId} />
        ) : (
          <ChatView messages={messages} />
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