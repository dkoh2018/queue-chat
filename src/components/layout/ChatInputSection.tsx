import { QueueToggle } from '@/components/features/sidebar/QueueToggle';
import { MessageQueueView } from '@/components/chat/MessageQueueView';
import { MessageInput } from '@/components/chat/MessageInput';
import { IntegrationType } from '@/types';

interface ChatInputSectionProps {
  // Input states
  inputText: string;
  setInputText: (text: string) => void;
  isOptimizing: boolean;
  
  // Queue states
  queueVisible: boolean;
  setQueueVisible: (visible: boolean) => void;
  messageQueue: string[];
  isProcessingQueue: boolean;
  onRemoveMessage: (message: string) => void;
  
  // Sidebar states
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  
  // Integration states
  isIntegrationPopupOpen: boolean;
  setIsIntegrationPopupOpen: (open: boolean) => void;
  activeIntegrations: IntegrationType[];
  onIntegrationSelect: (integration: IntegrationType) => void;
  
  // Handlers
  onSend: () => void;
  onOptimize: () => void;
  
  // Layout options
  hideDisclaimer?: boolean;
  showQueueWithDelay?: boolean;
}

export function ChatInputSection({
  inputText,
  setInputText,
  isOptimizing,
  queueVisible,
  setQueueVisible,
  messageQueue,
  isProcessingQueue,
  onRemoveMessage,
  sidebarOpen,
  setSidebarOpen,
  isIntegrationPopupOpen,
  setIsIntegrationPopupOpen,
  activeIntegrations,
  onIntegrationSelect,
  onSend,
  onOptimize,
  hideDisclaimer = false,
  showQueueWithDelay = false,
}: ChatInputSectionProps) {
  const queueClasses = showQueueWithDelay
    ? `transition-all duration-300 -mb-4 ${queueVisible ? 'opacity-100 pointer-events-auto delay-700' : 'opacity-0 pointer-events-none'}`
    : 'fade-in-animated';

  return (
    <div className="w-full max-w-[calc(100%-1rem)] sm:max-w-[600px] lg:max-w-[700px] xl:max-w-[750px] mx-auto">
      {/* Queue elements */}
      <div className={queueClasses}>
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
          onRemoveMessage={onRemoveMessage}
          isProcessing={isProcessingQueue}
          isVisible={queueVisible}
        />
      </div>

      <MessageInput
        inputText={inputText}
        setInputText={setInputText}
        onSend={onSend}
        onOptimize={onOptimize}
        isOptimizing={isOptimizing}
        onIntegrationSelect={onIntegrationSelect}
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
        hideDisclaimer={hideDisclaimer}
      />
    </div>
  );
}
