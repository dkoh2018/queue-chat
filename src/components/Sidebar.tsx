import { forwardRef, useState, useMemo } from 'react';
import { Conversation } from '@/types';
import { PlusIcon, SearchIcon, MenuIcon, XIcon } from '@/components/icons';
import Button from '@/components/ui/Button';

interface SidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  width: number;
  isResizing: boolean;
  newChatClicked: boolean;
  currentConversationId: string | null;
  conversations: Conversation[];
  loading: boolean;
  onNewChat: () => void;
  onSelectConversation: (conversation: Conversation) => void;
  onDeleteClick: (conversation: Conversation, e: React.MouseEvent) => void;
}

const Sidebar = forwardRef<HTMLDivElement, SidebarProps>(({
  sidebarOpen,
  setSidebarOpen,
  width,
  isResizing,
  newChatClicked,
  currentConversationId,
  conversations,
  loading,
  onNewChat,
  onSelectConversation,
  onDeleteClick,
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
    <>
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div
        ref={ref}
        className={`bg-[#111827] flex flex-col ${isResizing ? '' : 'transition-all duration-300'} overflow-hidden md:relative fixed left-0 top-0 h-full z-50 md:z-auto`}
        style={{ 
          width: sidebarOpen ? width : 0,
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'
        }}
      >
        {/* Sidebar Header */}
        <div className="p-3 sm:p-4 border-b border-gray-800">
          {isSearching ? (
            <div className="flex items-center justify-between mb-4">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-gray-800 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                autoFocus
              />
              <button onClick={handleCancelSearch} className="p-2 hover:bg-gray-700 rounded ml-2">
                <XIcon />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mb-4">
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-800 rounded">
                <MenuIcon />
              </button>
              <h1 className="text-xl font-bold text-white tracking-tight">Jarvis</h1>
              <button onClick={handleSearchClick} className="p-2 hover:bg-gray-800 rounded">
                <SearchIcon />
              </button>
            </div>
          )}
          
          <Button
            onClick={onNewChat}
            className={`w-full mb-4 ${
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
          </Button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto chat-scroll py-2">
          {loading ? (
            <div className="text-xs text-gray-400 px-3 sm:px-4">Loading conversations...</div>
          ) : filteredConversations.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-gray-400 px-3 sm:px-4 mb-3 sm:mb-4 tracking-wider uppercase">
                {searchQuery ? `RESULTS (${filteredConversations.length})` : `CHATS (${filteredConversations.length})`}
              </div>
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`group flex items-center justify-between px-2 sm:px-3 py-2 mx-2 sm:mx-3 rounded-lg cursor-pointer sidebar-item transition-colors duration-200 hover:bg-gray-800/50 ${
                    currentConversationId === conversation.id ? 'bg-gray-800 glowing-border' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-gray-100 truncate leading-relaxed pr-2">{conversation.title}</span>
                  <button
                    onClick={(e) => onDeleteClick(conversation, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600 rounded transition-all duration-200 text-gray-400 hover:text-white flex-shrink-0"
                    title="Delete conversation"
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="text-xs text-gray-400 px-3 sm:px-4">
              {searchQuery ? 'No conversations found.' : 'No conversations yet'}
            </div>
          )}
        </div>
      </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;