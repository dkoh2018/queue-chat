'use client';

import { useState, useEffect } from 'react';
import { useConversations, useChat } from '@/hooks';
import { Conversation } from '@/types';
import MarkdownMessage from '@/components/MarkdownMessage';

// Icons as SVG components
const PlusIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
  </svg>
);

const SearchIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
  </svg>
);

const AttachIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"/>
  </svg>
);


const MicIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/>
    <path d="M10 8a2 2 0 1 1-4 0V3a2 2 0 1 1 4 0v5zM8 0a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V3a3 3 0 0 0-3-3z"/>
  </svg>
);

const VoiceIcon = () => (
  <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
    <path d="M6.271 5.055a.5.5 0 0 1 .52.036L9.5 7.028a.5.5 0 0 1 0 .944L6.791 9.909a.5.5 0 0 1-.791-.407V5.498a.5.5 0 0 1 .271-.443z"/>
  </svg>
);

const SendIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M1 1l14 7-14 7V1z" />
  </svg>
);

const XIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
  </svg>
);

const ConfirmationModal = ({ isOpen, onConfirm, onCancel, conversationTitle }: {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  conversationTitle: string;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold text-white mb-4">Delete conversation?</h3>
        <p className="text-gray-300 mb-6">
          This will delete "{conversationTitle.length > 50 ? conversationTitle.slice(0, 50) + '...' : conversationTitle}"
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

const MenuIcon = () => (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
  </svg>
);


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
    error: conversationsError,
    fetchConversations,
    selectConversation,
    deleteConversation,
    setCurrentConversationId,
  } = useConversations();

  const {
    messages,
    isLoading: chatLoading,
    error: chatError,
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

  const handleCancelDelete = () => {
    setDeleteModalOpen(false);
    setConversationToDelete(null);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white relative">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`${
        sidebarOpen ? 'w-64' : 'w-0'
      } bg-gray-800 flex flex-col transition-all duration-300 overflow-hidden
        md:relative fixed left-0 top-0 h-full z-50 md:z-auto`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-700 rounded">
              <MenuIcon />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">Jarvis</h1>
            <button className="p-2 hover:bg-gray-700 rounded">
              <SearchIcon />
            </button>
          </div>
          
          <button 
            onClick={handleNewChat}
            className={`flex items-center justify-center w-full px-4 py-2 mb-4 rounded-lg transition-all duration-200 font-medium text-sm ${
              newChatClicked 
                ? 'bg-blue-500 scale-95' 
                : !currentConversationId 
                  ? 'bg-blue-600 hover:bg-blue-700' 
                  : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <PlusIcon />
            <span className="ml-2">New chat</span>
          </button>
          
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="text-xs text-gray-400 px-3">Loading conversations...</div>
          ) : conversations.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-gray-400 px-3 mb-4 tracking-wider uppercase">CHATS ({conversations.length})</div>
              {conversations.map((conversation) => {
                console.log('🔄 Rendering conversation:', conversation.title);
                return (
                <div 
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg cursor-pointer sidebar-item ${
                    currentConversationId === conversation.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-gray-100 truncate leading-relaxed">{conversation.title}</span>
                  <button 
                    onClick={(e) => handleDeleteClick(conversation, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600 rounded transition-all duration-200 text-gray-400 hover:text-white"
                    title="Delete conversation"
                  >
                    <XIcon />
                  </button>
                </div>
                );
              })}
            </>
          ) : (
            <div className="text-xs text-gray-400 px-3">No conversations yet</div>
          )}
        </div>

        {/* Sidebar Footer */}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} className="p-2 hover:bg-gray-700 rounded">
              <MenuIcon />
            </button>
          )}
          
          
        </div>

        {/* Chat Area or Welcome */}
        {!messages || messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-6 leading-tight tracking-tight">
                How can I help, <button className="hover:text-blue-400 transition-colors">David</button>?
              </h1>
              {!currentConversationId && (
                <div className="inline-flex items-center px-4 py-2 bg-blue-600/20 border border-blue-500/30 rounded-full">
                  <span className="text-blue-300 text-sm font-medium">
                    ✨ New chat started - Ask me anything!
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto chat-scroll px-4 sm:px-6 lg:px-8 py-8">
            <div className="max-w-4xl w-full mx-auto space-y-8 pb-8">
              {messages?.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-6`}
                >
                  <div className={`max-w-[85%] ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-2xl rounded-br-md px-6 py-4' 
                      : 'text-gray-100'
                  }`}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-invert prose-lg max-w-none">
                        <MarkdownMessage content={msg.content} />
                      </div>
                    ) : (
                      <div className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap break-words">
                        {msg.content}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-6 border-t border-gray-700/50">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-600/50 px-4 py-3 space-x-3 shadow-lg">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything..."
                className="flex-1 h-6 text-[15px] leading-relaxed text-white placeholder-gray-400 bg-transparent resize-none border-none outline-none focus:outline-none font-medium"
                style={{ wordBreak: 'break-word' }}
              />
              <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
                <AttachIcon />
              </button>
              <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
                <MicIcon />
              </button>
              <button className="p-2 hover:bg-gray-600 rounded-lg transition-colors">
                <VoiceIcon />
              </button>
              <button
                className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                onClick={handleSend}
              >
                <SendIcon />
              </button>
            </div>
            <div className="text-center mt-4">
              <p className="text-xs text-gray-500 font-medium">
                Jarvis can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
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
