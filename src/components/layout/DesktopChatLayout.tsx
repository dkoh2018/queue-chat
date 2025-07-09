import React from 'react';
import { User } from '@supabase/supabase-js';
import { ChatView } from '@/components/chat/ChatView';
import { ChatTitle } from './ChatTitle';
import { ChatInputSection } from './ChatInputSection';
import { IntegrationType } from '@/types';

interface DesktopChatLayoutProps {
  user: User | null;
  isNewChat: boolean;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  isLoading: boolean;
  chatScrollRef: React.RefObject<HTMLDivElement | null>;
  
  // Input section props
  inputText: string;
  setInputText: (text: string) => void;
  isOptimizing: boolean;
  queueVisible: boolean;
  setQueueVisible: (visible: boolean) => void;
  messageQueue: string[];
  isProcessingQueue: boolean;
  onRemoveMessage: (message: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isIntegrationPopupOpen: boolean;
  setIsIntegrationPopupOpen: (open: boolean) => void;
  activeIntegrations: IntegrationType[];
  onIntegrationSelect: (integration: IntegrationType) => void;
  onSend: () => void;
  onOptimize: () => void;
}

export function DesktopChatLayout({
  user,
  isNewChat,
  messages,
  isLoading,
  chatScrollRef,
  ...inputSectionProps
}: DesktopChatLayoutProps) {
  return (
    <div className="hidden md:block flex-1 h-full">
      <div className={`h-full flex flex-col px-4 sm:px-6 lg:px-8 chat-layout-animated ${isNewChat ? 'chat-layout-centered' : 'chat-layout-normal'}`}>
        {/* Title - always present, animates position */}
        <div className="title-animated">
          <ChatTitle user={user} variant="desktop" />
        </div>

        {/* Chat messages - only show when not new chat */}
        {!isNewChat && (
          <div className="flex-1 min-h-0 overflow-hidden">
            <ChatView messages={messages} isLoading={isLoading} ref={chatScrollRef} />
          </div>
        )}

        {/* Input container - always present, animates position */}
        <div className="input-animated">
          <ChatInputSection
            {...inputSectionProps}
            hideDisclaimer={isNewChat}
            showQueueWithDelay={false}
            showQueueButton={!isNewChat}
          />
        </div>
      </div>
    </div>
  );
}
