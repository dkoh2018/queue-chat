import { forwardRef, memo, useState, useMemo } from 'react';
import { Conversation } from '@/types';
import { PlusIcon, SearchIcon, MenuIcon, XIcon } from '@/components/icons';
import AuthButton from '@/components/auth/AuthButton';
import styles from './Sidebar.module.css';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  newChatClicked: boolean;
  currentConversationId: string | null;
  conversations: Conversation[];
  loading: boolean;
  refreshing: boolean;
  isOnline: boolean;
  error: string | null;
  onNewChat: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteClick: (conversation: Conversation, e: React.MouseEvent) => void;
  onClearAppData?: () => void;
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteClick: (conversation: Conversation, e: React.MouseEvent) => void;
}

const ConversationItem = memo(({ 
  conversation, 
  isActive, 
  onSelectConversation, 
  onDeleteClick 
}: ConversationItemProps) => {
  return (
    <div
      key={conversation.id}
      onClick={() => onSelectConversation(conversation)}
      className={`group flex items-center justify-between px-2 sm:px-2 py-2 mx-2 sm:mx-2 rounded-lg cursor-pointer sidebar-item transition-all duration-200 ${
        isActive ? 'glass-card glass-glow-green' : 'hover:glass-card'
      }`}
    >
      <span className="text-sm font-medium text-gray-100 truncate leading-relaxed pr-2">{conversation.title}</span>
      <button
        onClick={(e) => onDeleteClick(conversation, e)}
        className="opacity-0 group-hover:opacity-100 p-1.5 glass-button rounded transition-all duration-200 text-gray-400 hover:text-white flex-shrink-0 hover:border-red-500/60 hover:shadow-red-500/20"
        title="Delete conversation"
      >
        <XIcon />
      </button>
    </div>
  );
});

ConversationItem.displayName = 'ConversationItem';

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({  sidebarOpen,
  setSidebarOpen,
  newChatClicked,
  currentConversationId,
  conversations,
  loading,
  refreshing,
  isOnline,
  error,
  onNewChat,
  onSelectConversation,
  onDeleteClick,
  onClearAppData,
}, ref) => {
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = useMemo(() => {
    if (!searchQuery) {
      return conversations;
    }
    return conversations.filter(conversation =>
      conversation.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [conversations, searchQuery]);

  const handleSearchClick = () => {
    setIsSearching(true);
  };

  const handleCancelSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
  };


  return (
    <div
      ref={ref}
      className={`glass-panel ${styles.container} ${!sidebarOpen ? '' : styles.containerTransition}`}
      style={{
        width: sidebarOpen ? 256 : 0
      }}
    >
        {/* Sidebar Header */}
        <div className="p-3 sm:p-4 border-b border-gray-600/50">
          {isSearching ? (
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-white/10 backdrop-blur-md text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 border border-white/20"
                autoFocus
              />
              <button onClick={handleCancelSearch} className="p-2 hover:bg-white/20 rounded ml-2 transition-colors">
                <XIcon />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-white/20 rounded transition-colors">
                <MenuIcon />
              </button>
              <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                Jarvis
                {refreshing && (
                  <div className="w-3 h-3 border border-emerald-400 border-t-transparent rounded-full animate-spin" />
                )}
                {!isOnline && (
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" title="Offline" />
                )}
              </h1>
              <button onClick={handleSearchClick} className="p-2 hover:bg-white/20 rounded transition-colors">
                <SearchIcon />
              </button>
            </div>
          )}
          
          <button
            onClick={onNewChat}
            className={`w-full mb-4 px-4 py-2 rounded-md transition-colors ${
              newChatClicked
                ? 'bg-emerald-600'
                : !currentConversationId
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-gray-800 hover:bg-gray-700'
            }`}
          >
            <div className="flex items-center justify-center">
              <PlusIcon />
              <span className="ml-2">New chat</span>
            </div>
          </button>
        </div>

        {/* Chat History */}
        <div className={`${styles.chatHistory} customScroll`}>
          {error && (
            <div className="text-xs text-orange-400 px-3 sm:px-4 mb-3 bg-orange-500/10 py-2 mx-2 rounded border border-orange-500/20">
              {error}
            </div>
          )}
          {loading ? (
            <div className="text-xs text-gray-400 px-3 sm:px-4">Loading conversations...</div>
          ) : filteredConversations.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-gray-400 px-3 sm:px-4 mb-3 sm:mb-4 tracking-wider uppercase">
                {searchQuery ? `RESULTS (${filteredConversations.length})` : `CHATS (${filteredConversations.length})`}
              </div>
              {filteredConversations.map((conversation) => (
                <ConversationItem
                  key={conversation.id}
                  conversation={conversation}
                  isActive={currentConversationId === conversation.id}
                  onSelectConversation={onSelectConversation}
                  onDeleteClick={onDeleteClick}
                />
              ))}
            </>
          ) : (
            <div className="text-xs text-gray-400 px-3 sm:px-4">
              {searchQuery ? 'No conversations found.' : 'No conversations yet'}
            </div>
          )}
        </div>

        {/* Authentication Button - Bottom Right */}
        <div className="absolute bottom-4 right-4">
          <AuthButton onClearAppData={onClearAppData} />
        </div>
    </div>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;