import { forwardRef } from 'react';
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
        style={{ width: sidebarOpen ? width : 0 }}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-800 rounded">
              <MenuIcon />
            </button>
            <h1 className="text-xl font-bold text-white tracking-tight">Jarvis</h1>
            <button className="p-2 hover:bg-gray-800 rounded">
              <SearchIcon />
            </button>
          </div>
          
          <Button
            onClick={onNewChat}
            className={`w-full mb-4 transition-all duration-200 ${
              newChatClicked
                ? 'bg-emerald-600 scale-95'
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
        <div className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <div className="text-xs text-gray-400 px-3">Loading conversations...</div>
          ) : conversations.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-gray-400 px-3 mb-4 tracking-wider uppercase">CHATS ({conversations.length})</div>
              {conversations.map((conversation) => (
                <div 
                  key={conversation.id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg cursor-pointer sidebar-item ${
                    currentConversationId === conversation.id ? 'bg-gray-800 glowing-border' : ''
                  }`}
                >
                  <span className="text-sm font-medium text-gray-100 truncate leading-relaxed">{conversation.title}</span>
                  <button 
                    onClick={(e) => onDeleteClick(conversation, e)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600 rounded transition-all duration-200 text-gray-400 hover:text-white"
                    title="Delete conversation"
                  >
                    <XIcon />
                  </button>
                </div>
              ))}
            </>
          ) : (
            <div className="text-xs text-gray-400 px-3">No conversations yet</div>
          )}
        </div>
      </div>
    </>
  );
});

Sidebar.displayName = 'Sidebar';

export default Sidebar;