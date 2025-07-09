'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversations, useChat, useMobileKeyboardHandling, usePersistedState, useKeyboardShortcuts, useScrollManagement, useAuthGuard } from '@/hooks';
import { Conversation } from '@/types';
import { optimizationService } from '@/services';
import Sidebar from '@/components/features/sidebar/Sidebar';
import { DeleteConfirmation } from '@/components/ui/DeleteConfirmation';
import { ErrorToast } from '@/components/ui/ErrorToast';
import { FloatingSidebarToggle, DesktopChatLayout, MobileChatLayout } from '@/components/layout';

function MainChatInterface() {
  useMobileKeyboardHandling();
  const { user, AuthGuardComponent } = useAuthGuard();
  const [sidebarOpen, setSidebarOpen] = usePersistedState('sidebarOpen', true);
  const [inputText, setInputText] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [queueVisible, setQueueVisible] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isIntegrationPopupOpen, setIsIntegrationPopupOpen] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const mobileScrollRef = useRef<HTMLDivElement>(null);

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

  const handleChatMessageSent = useCallback((conversationId: string) => {
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
    clearAllData: clearChatData,
    activeIntegrations,
    toggleIntegration,
    error,
    clearError,
  } = useChat(handleChatMessageSent, currentConversationId, setCurrentConversationId);

  const { restoreScrollPosition } = useScrollManagement({
    messages,
    currentConversationId,
    chatScrollRef,
  });

  useScrollManagement({
    messages,
    currentConversationId,
    chatScrollRef: mobileScrollRef,
  });

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Restore conversation on page load - this runs once when conversations are loaded
  useEffect(() => {
    if (currentConversationId && conversations.length > 0 && !conversationsLoading && !refreshing) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation && messages.length === 0) {
        console.log('🔍 Page load restoration:', {
          conversationId: currentConversationId,
          foundConversation: !!conversation,
          messageCount: conversation?.messages?.length || 0,
          currentUIMessages: messages.length
        });

        // Initial restoration on page load when no messages exist
        const uiMessages = conversation.messages.map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant', // Convert 'USER'/'ASSISTANT' to 'user'/'assistant'
          content: msg.content
        }));
        setMessages(uiMessages);
      }
    }
  }, [currentConversationId, conversations, conversationsLoading, refreshing, setMessages, messages.length]);

  useEffect(() => {
    if (currentConversationId && conversations.length > 0 && !isLoading && !isProcessingQueue) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation && conversation.messages.length > 0) {
        // More efficient comparison - check length first, then content if needed
        if (messages.length !== conversation.messages.length) {
          const uiMessages = conversation.messages.map(msg => ({
            role: msg.role.toLowerCase() as 'user' | 'assistant',
            content: msg.content
          }));
          setMessages(uiMessages);
        } else if (messages.length > 0) {
          // Only do content comparison if lengths match but we suspect mismatch
          const currentMessageContent = messages.map(msg => msg.content).join('|');
          const conversationMessageContent = conversation.messages.map(msg => msg.content).join('|');

          if (currentMessageContent !== conversationMessageContent) {
            const uiMessages = conversation.messages.map(msg => ({
              role: msg.role.toLowerCase() as 'user' | 'assistant',
              content: msg.content
            }));
            setMessages(uiMessages);
          }
        }
      }
    }
  }, [currentConversationId, conversations, setMessages, isLoading, isProcessingQueue, messages]);

  const handleNewChat = useCallback(() => {
    clearMessages();
    setCurrentConversationId(null);
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
    setTimeout(() => {
      const textarea = document.querySelector('textarea[placeholder="Ask anything"]') as HTMLTextAreaElement;
      if (textarea) {
        textarea.focus();
      }
    }, 150);
  }, [clearMessages, setCurrentConversationId, sidebarOpen, setSidebarOpen]);

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  useKeyboardShortcuts({
    handleNewChat,
    setSidebarOpen,
    deleteModalOpen,
    handleCancelDelete,
  });

  const isNewChat = !messages || messages.length === 0;

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
    setInputText('');
    try {
      const response = await optimizationService.optimizeInput({
        userInput: text,
        conversationHistory: messages,
      });
      setInputText(response.optimizedInput);
    } catch {
      setInputText(originalText);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSelectConversation = useCallback((conversation: Conversation) => {
    // Immediate state update for instant UI feedback
    setCurrentConversationId(conversation.id);

    // Batch all UI updates together
    const uiMessages = conversation.messages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content
    }));

    // Single batch update
    clearMessages();
    setMessages(uiMessages);

    // Handle persistence and scroll restoration
    selectConversation(conversation);
    restoreScrollPosition(conversation.id);
  }, [setCurrentConversationId, clearMessages, setMessages, selectConversation, restoreScrollPosition]);

  const handleDeleteClick = (conversation: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setConversationToDelete(conversation);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!conversationToDelete) return;
    try {
      handleConversationDeleted(conversationToDelete.id);
      await deleteConversation(conversationToDelete.id);
      if (currentConversationId === conversationToDelete.id) {
        handleNewChat();
      }
    } catch {
    } finally {
      setDeleteModalOpen(false);
      setConversationToDelete(null);
    }
  };

  const handleClearAllAppData = useCallback(() => {
    clearConversationData();
    clearChatData();
  }, [clearConversationData, clearChatData]);

  if (AuthGuardComponent) {
    return <AuthGuardComponent />;
  }

  return (
    <div className="flex text-white relative main-container">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
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
      <div className="flex-1 flex flex-col relative min-w-0 sidebar-mobile-safe">
        <FloatingSidebarToggle 
          isVisible={!sidebarOpen}
          onToggle={() => setSidebarOpen(true)}
        />
        <DesktopChatLayout
          user={user}
          isNewChat={isNewChat}
          messages={messages}
          isLoading={isLoading}
          chatScrollRef={chatScrollRef}
          inputText={inputText}
          setInputText={setInputText}
          isOptimizing={isOptimizing}
          queueVisible={queueVisible}
          setQueueVisible={setQueueVisible}
          messageQueue={messageQueue}
          isProcessingQueue={isProcessingQueue}
          onRemoveMessage={removeMessageFromQueue}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isIntegrationPopupOpen={isIntegrationPopupOpen}
          setIsIntegrationPopupOpen={setIsIntegrationPopupOpen}
          activeIntegrations={activeIntegrations}
          onIntegrationSelect={toggleIntegration}
          onSend={handleSend}
          onOptimize={handleOptimize}
        />
        <MobileChatLayout
          user={user}
          messages={messages}
          isLoading={isLoading}
          chatScrollRef={mobileScrollRef}
          inputText={inputText}
          setInputText={setInputText}
          isOptimizing={isOptimizing}
          queueVisible={queueVisible}
          setQueueVisible={setQueueVisible}
          messageQueue={messageQueue}
          isProcessingQueue={isProcessingQueue}
          onRemoveMessage={removeMessageFromQueue}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          isIntegrationPopupOpen={isIntegrationPopupOpen}
          setIsIntegrationPopupOpen={setIsIntegrationPopupOpen}
          activeIntegrations={activeIntegrations}
          onIntegrationSelect={toggleIntegration}
          onSend={handleSend}
          onOptimize={handleOptimize}
        />
        <ErrorToast error={error} onClearError={clearError} />
      </div>
      <DeleteConfirmation
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