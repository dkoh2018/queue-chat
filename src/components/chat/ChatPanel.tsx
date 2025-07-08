import React, { Ref } from 'react';
import { User } from '@supabase/supabase-js';
import { ChatView } from './ChatView';
import { QueueToggle } from '../features/sidebar/QueueToggle';
import { MessageQueueView } from './MessageQueueView';
import { IntegrationType } from '@/types';
import { MessageInput } from './MessageInput';

interface ChatPanelProps {
  isMobile: boolean;
  user: User | null;
  messages: { role: 'user' | 'assistant'; content: string }[];
  isLoading: boolean;
  chatRef: Ref<HTMLDivElement>;
  isNewChat: boolean;
  queueVisible: boolean;
  setQueueVisible: (v: boolean | ((prev: boolean) => boolean)) => void;
  messageQueue: string[];
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  inputText: string;
  setInputText: (v: string) => void;
  handleSend: () => Promise<void>;
  handleOptimize: () => Promise<void>;
  isOptimizing: boolean;
  toggleIntegration: (type: IntegrationType) => void;
  activeIntegrations: IntegrationType[];
  isIntegrationPopupOpen: boolean;
  setIsIntegrationPopupOpen: (v: boolean | ((prev: boolean) => boolean)) => void;
  removeMessageFromQueue: (message: string) => void;
  isProcessingQueue: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  isMobile,
  user,
  messages,
  isLoading,
  chatRef,
  isNewChat,
  queueVisible,
  setQueueVisible,
  messageQueue,
  sidebarOpen,
  setSidebarOpen,
  inputText,
  setInputText,
  handleSend,
  handleOptimize,
  isOptimizing,
  toggleIntegration,
  activeIntegrations,
  isIntegrationPopupOpen,
  setIsIntegrationPopupOpen,
  removeMessageFromQueue,
  isProcessingQueue,
}) => {
  const titleSize = isMobile
    ? 'text-2xl sm:text-3xl'
    : 'text-3xl sm:text-4xl lg:text-5xl';

  return (
    <div
      className={`flex-1 flex flex-col h-full px-4 sm:px-6 lg:px-8 ${
        isMobile ? 'overflow-hidden' : ''
      }`}
    >
      {/* Title / welcome area */}
      <div
        className={`flex-shrink-0 ${
          !messages || messages.length === 0
            ? 'flex-1 flex flex-col justify-center items-center'
            : 'h-0 overflow-hidden'
        }`}
      >
        <h1
          className={`${titleSize} font-semibold text-white leading-tight tracking-tight text-center mb-8`}
        >
          How can I help,{' '}
          <button className="hover:text-emerald-400 transition-colors">
            {user?.user_metadata?.first_name ||
              user?.user_metadata?.full_name?.split(' ')[0] ||
              'there'}
          </button>
          ?
        </h1>
      </div>

      {/* Chat messages */}
      {messages && messages.length > 0 && (
        <div className="flex-1 min-h-0 overflow-hidden">
          <ChatView messages={messages} isLoading={isLoading} ref={chatRef} />
        </div>
      )}

      {/* Queue + input */}
      <div
        className={
          isMobile
            ? 'flex-shrink-0 backdrop-blur-sm z-10'
            : 'input-animated'
        }
        style={
          isMobile
            ? {
                paddingTop: '1rem',
                paddingBottom:
                  'calc(var(--safe-bottom, 0px) + var(--input-spacing, 16px))',
              }
            : undefined
        }
      >
        <div className="w-full max-w-[calc(100%-1rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px] mx-auto">
          <div
            className={`
              isMobile ? 'transition-all duration-300 -mb-4' : 'fade-in-animated'
            } ${
              !messages || messages.length === 0
                ? 'opacity-0 pointer-events-none'
                : `opacity-100 pointer-events-auto${isMobile ? ' delay-700' : ''}`
            }`}
          >
            <QueueToggle
              isOpen={queueVisible}
              onToggle={() => setQueueVisible(!queueVisible)}
              queueCount={messageQueue.length}
              sidebarOpen={sidebarOpen}
              setSidebarOpen={setSidebarOpen}
              onCloseIntegrationPopup={() => {
                if (isIntegrationPopupOpen) {
                  setIsIntegrationPopupOpen(false);
                }
              }}
            />
            <MessageQueueView
              messageQueue={messageQueue}
              onRemoveMessage={removeMessageFromQueue}
              isProcessing={isProcessingQueue}
              isVisible={queueVisible}
            />
          </div>
          <MessageInput
            inputText={inputText}
            setInputText={setInputText}
            onSend={handleSend}
            onOptimize={handleOptimize}
            isOptimizing={isOptimizing}
            onIntegrationSelect={toggleIntegration}
            activeIntegrations={activeIntegrations}
            isIntegrationPopupOpen={isIntegrationPopupOpen}
            onIntegrationPopupStateChange={setIsIntegrationPopupOpen}
            onCloseSidebar={() => {
              if (sidebarOpen) {
                setSidebarOpen(false);
              }
            }}
            onCloseQueue={() => {
              if (queueVisible) {
                setQueueVisible(false);
              }
            }}
            onFocus={() => {
              if (typeof window !== 'undefined' && window.innerWidth < 768 && sidebarOpen) {
                setSidebarOpen(false);
              }
            }}
            hideDisclaimer={isMobile ? false : isNewChat}
          />
        </div>
      </div>
    </div>
  );
};
