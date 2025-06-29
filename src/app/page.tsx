'use client';

import { useState } from 'react';

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

const OptionsIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
    <path d="M3 9.5a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
    <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
  </svg>
);

const ChatItem = ({ title, isActive = false }: { title: string; isActive?: boolean }) => (
  <div className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg cursor-pointer sidebar-item ${isActive ? 'bg-gray-700' : ''}`}>
    <span className="text-sm text-gray-200 truncate">{title}</span>
    <button className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded">
      <OptionsIcon />
    </button>
  </div>
);

interface Conversation {
  id: string;
  title: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
  createdAt: Date;
}

export default function Jarvis() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;
    // add user message to state and send API request
    const newMessages: { role: 'user' | 'assistant'; content: string }[] = [
      ...messages,
      { role: 'user', content: text },
    ];
    setMessages(newMessages);
    setInputText('');
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
      });
      const data = await res.json();
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        return;
      }
      setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err) {
      console.error('Failed to fetch assistant response:', err);
    }
  };

  const handleNewChat = () => {
    if (messages.length > 0) {
      // Save current conversation if it has messages
      const newConversation: Conversation = {
        id: Date.now().toString(),
        title: messages[0]?.content.slice(0, 30) + '...' || 'New chat',
        messages: [...messages],
        createdAt: new Date()
      };
      setConversations(prev => [newConversation, ...prev]);
    }
    // Start new conversation
    setMessages([]);
    setCurrentConversationId(null);
  };

  const handleSelectConversation = (conversation: Conversation) => {
    setMessages(conversation.messages);
    setCurrentConversationId(conversation.id);
  };

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-gray-800 flex flex-col transition-all duration-300 overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-700 rounded">
              <MenuIcon />
            </button>
            <h1 className="text-lg font-semibold">Jarvis</h1>
            <button className="p-2 hover:bg-gray-700 rounded">
              <SearchIcon />
            </button>
          </div>
          
          <button 
            onClick={handleNewChat}
            className="flex items-center w-full px-3 py-2 mb-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors sidebar-item"
          >
            <PlusIcon />
            <span className="ml-2 text-sm">New chat</span>
          </button>
          
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto py-2">
          {conversations.length > 0 && (
            <>
              <div className="text-xs text-gray-400 px-3 mb-2">CHATS</div>
              {conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  onClick={() => handleSelectConversation(conversation)}
                  className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg cursor-pointer sidebar-item ${
                    currentConversationId === conversation.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <span className="text-sm text-gray-200 truncate">{conversation.title}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setConversations(prev => prev.filter(c => c.id !== conversation.id));
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-600 rounded"
                  >
                    <OptionsIcon />
                  </button>
                </div>
              ))}
            </>
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
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center px-4">
            <h1 className="text-4xl font-normal text-white">
              How can I help, <button className="hover:underline">David</button>?
            </h1>
          </div>
        ) : (
          <div className="flex-1 flex flex-col overflow-y-auto chat-scroll px-4 py-6">
            <div className="max-w-3xl w-full mx-auto space-y-4 mt-8">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="text-white whitespace-pre-wrap break-words max-w-[80%]">
                    {msg.content}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="p-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center bg-gray-700 rounded-2xl border border-gray-600 px-4 py-2 space-x-2">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask anything"
                className="flex-1 h-10 text-white placeholder-gray-400 bg-transparent resize-none border-none outline-none focus:outline-none"
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
            <div className="text-center mt-2">
              <p className="text-xs text-gray-400">
                Jarvis can make mistakes. Check important info.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
