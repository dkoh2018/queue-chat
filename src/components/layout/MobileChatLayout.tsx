import React from 'react';
import { User } from '@supabase/supabase-js';
import { ChatView } from '@/components/chat/ChatView';
import { ChatTitle } from './ChatTitle';
import { ChatInputSection } from './ChatInputSection';
import { IntegrationType } from '@/types';

interface MobileChatLayoutProps {
  user: User | null;
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
  isWebSearchActive: boolean;
  onWebSearchToggle: () => void;
}

export function MobileChatLayout({
  user,
  messages,
  isLoading,
  chatScrollRef,
  queueVisible,
  ...inputSectionProps
}: MobileChatLayoutProps) {
  const hasMessages = messages && messages.length > 0;

  return (
    <div className="md:hidden flex-1 flex flex-col px-4 sm:px-6 lg:px-8 h-full overflow-hidden">
      {/* Title - flex-shrink: 0 when visible, hidden when chat exists */}
      <div className={`flex-shrink-0 ${!hasMessages ? 'flex-1 flex flex-col justify-center items-center' : 'h-0 overflow-hidden'}`}>
        <div className="mb-8">
          <ChatTitle user={user} variant="mobile" />
        </div>
      </div>

      {/* Chat messages - flex: 1 with overflow like sidebar chatHistory */}
      {hasMessages && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatView messages={messages} isLoading={isLoading} ref={chatScrollRef} />
        </div>
      )}

      {/* Input container - flex-shrink: 0 like sidebar footer */}
      <div className="flex-shrink-0 backdrop-blur-sm z-10" style={{
        paddingTop: '1rem',
        paddingBottom: 'calc(var(--safe-bottom, 0px) + var(--input-spacing, 16px))'
      }}>
        <ChatInputSection
          {...inputSectionProps}
          queueVisible={queueVisible}
          hideDisclaimer={!hasMessages}
          showQueueWithDelay={true}
          showQueueButton={hasMessages}
        />
      </div>
    </div>
  );
}
