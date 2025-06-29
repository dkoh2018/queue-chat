import { useState } from 'react';
import { Conversation } from '@/types';

// Icons
const XIcon = () => (
  <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
    <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 2.854Z"/>
  </svg>
);

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: (conversation: Conversation) => void;
  onDelete: (conversationId: string) => Promise<void>;
}

const ConversationItem = ({ conversation, isActive, onSelect, onDelete }: ConversationItemProps) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isDeleting) return;
    
    try {
      setIsDeleting(true);
      await onDelete(conversation.id);
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div 
      onClick={() => onSelect(conversation)}
      className={`group flex items-center justify-between px-3 py-2 mx-2 rounded-lg cursor-pointer sidebar-item transition-colors ${
        isActive ? 'bg-gray-700' : 'hover:bg-gray-700'
      }`}
    >
      <span className="text-sm text-gray-200 truncate" title={conversation.title}>
        {conversation.title}
      </span>
      
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-600 rounded transition-all duration-200 text-gray-400 hover:text-white disabled:opacity-50"
        title="Delete conversation"
      >
        {isDeleting ? (
          <div className="w-3.5 h-3.5 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <XIcon />
        )}
      </button>
    </div>
  );
};

export default ConversationItem;