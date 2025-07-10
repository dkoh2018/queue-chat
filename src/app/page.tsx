'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useConversations, useChat, useMobileKeyboardHandling, usePersistedState, useKeyboardShortcuts, useScrollManagement, useAuthGuard, useCustomPrompt } from '@/hooks';
import { Conversation } from '@/types';
import { optimizationService } from '@/services';
import Sidebar from '@/components/features/sidebar/Sidebar';
import { DeleteConfirmation, ErrorToast, CustomPromptModal } from '@/components/ui';
import { FloatingSidebarToggle, DesktopChatLayout, MobileChatLayout } from '@/components/layout';

// Hook to track screen size
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isMobile;
}

function MainChatInterface() {
  useMobileKeyboardHandling();
  const { user, AuthGuardComponent } = useAuthGuard();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = usePersistedState('sidebarOpen', true);
  const [inputText, setInputText] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [conversationToDelete, setConversationToDelete] = useState<Conversation | null>(null);
  const [queueVisible, setQueueVisible] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isIntegrationPopupOpen, setIsIntegrationPopupOpen] = useState(false);
  const [customPromptModalOpen, setCustomPromptModalOpen] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
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
    handleConversationDeleted,
  } = useConversations();

  const handleChatMessageSent = useCallback((conversationId: string, userMessage?: string) => {
    handleMessageSent(conversationId, userMessage);
  }, [handleMessageSent]);

  const { systemInstructions, setSystemInstructions } = useCustomPrompt();

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
  } = useChat(handleChatMessageSent, currentConversationId, setCurrentConversationId, systemInstructions);

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

  useEffect(() => {
    if (currentConversationId && conversations.length > 0 && !conversationsLoading && !refreshing) {
      const conversation = conversations.find(c => c.id === currentConversationId);
      if (conversation && messages.length === 0) {
        const uiMessages = conversation.messages.map(msg => ({
          role: msg.role.toLowerCase() as 'user' | 'assistant',
          content: msg.content
        }));
        setMessages(uiMessages);
      }
    }
  }, [currentConversationId, conversations, conversationsLoading, refreshing, setMessages, messages.length]);



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

  const handleCustomPrompt = useCallback(() => {
    setCustomPromptModalOpen(true);
  }, []);

  const handleSaveCustomPrompt = useCallback((instructions: string) => {
    setSystemInstructions(instructions);
    setCustomPromptModalOpen(false);
  }, [setSystemInstructions]);

  const handleCancelCustomPrompt = useCallback(() => {
    setCustomPromptModalOpen(false);
  }, []);

  const handleWebSearchToggle = useCallback(() => {
    setIsWebSearchActive(prev => !prev);
  }, []);

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
    const uiMessages = conversation.messages.map(msg => ({
      role: msg.role.toLowerCase() as 'user' | 'assistant',
      content: msg.content
    }));

    clearMessages();
    setMessages(uiMessages);
    selectConversation(conversation);
    restoreScrollPosition(conversation.id);
  }, [clearMessages, setMessages, selectConversation, restoreScrollPosition]);

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

  if (isMobile) {
    return (
      <div className="flex text-white relative main-container">
        <FloatingSidebarToggle 
          isVisible={!sidebarOpen}
          onToggle={() => setSidebarOpen(true)}
        />
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
          onCustomPrompt={handleCustomPrompt}
        />
        <div className="flex-1 flex flex-col relative min-w-0 sidebar-mobile-safe">
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
            isWebSearchActive={isWebSearchActive}
            onWebSearchToggle={handleWebSearchToggle}
          />
          <ErrorToast error={error} onClearError={clearError} />
        </div>
        <DeleteConfirmation
          isOpen={deleteModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          conversationTitle={conversationToDelete?.title || ''}
        />
        <CustomPromptModal
          isOpen={customPromptModalOpen}
          onSave={handleSaveCustomPrompt}
          onCancel={handleCancelCustomPrompt}
          currentInstructions={systemInstructions}
        />
      </div>
    );
  } else {
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
          onCustomPrompt={handleCustomPrompt}
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
            isWebSearchActive={isWebSearchActive}
            onWebSearchToggle={handleWebSearchToggle}
          />
          <ErrorToast error={error} onClearError={clearError} />
        </div>
        <DeleteConfirmation
          isOpen={deleteModalOpen}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          conversationTitle={conversationToDelete?.title || ''}
        />
        <CustomPromptModal
          isOpen={customPromptModalOpen}
          onSave={handleSaveCustomPrompt}
          onCancel={handleCancelCustomPrompt}
          currentInstructions={systemInstructions}
        />
      </div>
    );
  }
}

export default function Jarvis() {
  return <MainChatInterface />;
}