'use client';

import { useState, useEffect } from 'react';
import { useConversations, useChat } from '@/hooks';
import { Conversation } from '@/types';
import { Sidebar } from '@/components/Sidebar';
import { ChatView } from '@/components/ChatView';
import { WelcomeView } from '@/components/WelcomeView';
import { MessageInput } from '@/components/MessageInput';
import { ConfirmationModal } from '@/components/ConfirmationModal';

export default function Jarvis() {
  // UI State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [newChatClicked, setNewChatClicked] = useState(false);

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
    sendMessage,
    clearMessages,
    setMessages,
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
    const newConversationId = await sendMessage(text, currentConversationId);
    
    // Update conversation ID if this created a new conversation
    if (!currentConversationId && newConversationId) {
      setCurrentConversationId(newConversationId);
    }
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
    <div className="flex h-screen bg-gray-900 text-white relative">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        newChatClicked={newChatClicked}
        currentConversationId={currentConversationId}
        conversations={conversations}
        loading={loading}
        onNewChat={handleNewChat}
        onSelectConversation={handleSelectConversation}
        onDeleteClick={handleDeleteClick}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Chat Area or Welcome - now takes full height */}
        {!messages || messages.length === 0 ? (
          <WelcomeView currentConversationId={currentConversationId} />
        ) : (
          <ChatView messages={messages} />
        )}

        {/* Fixed Message Input - positioned inside main content */}
        <MessageInput
          inputText={inputText}
          setInputText={setInputText}
          onSend={handleSend}
        />
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