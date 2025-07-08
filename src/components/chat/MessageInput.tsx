import { useRef, useEffect, useCallback } from 'react';
import { AttachIcon } from '@/components/icons';
import { UpArrowIcon } from '@/components/icons';
import OptimizeButton from '@/components/features/OptimizeButton';
import { TypingDots } from '@/components/ui/TypingDots';
import { VoiceRecordingButton } from '@/components/features/VoiceRecordingButton';
import { IntegrationButton } from '@/components/features/IntegrationButton';
import { useVoiceRecording } from '@/hooks';
import { IntegrationType } from '@/types';
import styles from './MessageInput.module.css';

interface MessageInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
  onOptimize?: () => void;
  isOptimizing?: boolean;
  onIntegrationSelect?: (type: IntegrationType) => void;
  activeIntegrations?: IntegrationType[];
  onFocus?: () => void;
  isIntegrationPopupOpen?: boolean;
  onIntegrationPopupStateChange?: (isOpen: boolean) => void;
  onCloseSidebar?: () => void;
  onCloseQueue?: () => void;
}

export const MessageInput = ({ inputText, setInputText, onSend, onOptimize, isOptimizing = false, onIntegrationSelect, activeIntegrations, onFocus, isIntegrationPopupOpen = false, onIntegrationPopupStateChange, onCloseSidebar, onCloseQueue }: MessageInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTranscriptionRef = useRef<string | undefined>(undefined);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    state: voiceState,
    mediaStream,
    startRecording,
    stopRecording
  } = useVoiceRecording();

  useEffect(() => {
    if (voiceState.rawTranscription && voiceState.rawTranscription !== lastTranscriptionRef.current) {
      const newText = inputText ? `${inputText} ${voiceState.rawTranscription}` : voiceState.rawTranscription;
      setInputText(newText);
      lastTranscriptionRef.current = voiceState.rawTranscription;
    }
  }, [voiceState.rawTranscription, inputText, setInputText]);

  const resizeTextarea = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current);
    }

    resizeTimeoutRef.current = setTimeout(() => {
      const baseHeight = 60;
      const maxHeight = 160;
      
      if (!inputText.trim()) {
        textarea.style.height = `${baseHeight}px`;
        textarea.style.overflowY = 'hidden';
        return;
      }
      
      textarea.style.height = `${baseHeight}px`;
      
      void textarea.offsetHeight;
      
      const scrollHeight = textarea.scrollHeight;
      
      const buffer = 10;
      if (scrollHeight > baseHeight + buffer) {
        const newHeight = Math.min(scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        
        if (newHeight >= maxHeight) {
          textarea.style.overflowY = 'auto';
        } else {
          textarea.style.overflowY = 'hidden';
        }
      } else {
        textarea.style.height = `${baseHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }, 10);
  }, [inputText]);

  useEffect(() => {
    resizeTextarea();
    
    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [resizeTextarea]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = '60px';
      textarea.style.overflowY = 'hidden';
    }
  }, []);

  const handleTextareaFocus = useCallback(() => {
    setTimeout(() => resizeTextarea(), 0);
    onFocus?.();
  }, [resizeTextarea, onFocus]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    resizeTextarea();
  }, [setInputText, resizeTextarea]);

  const blurTextInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.blur();
    }
  }, []);

  return (
    <>
      <div className={`${styles.container} ${isIntegrationPopupOpen ? styles.popupOpen : ''}`}>
        <div className={styles.background} />
        
        <div className={styles.content}>
          {isOptimizing ? (
            <div className={styles.loadingContainer}>
              <TypingDots />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={handleInputChange}
              onFocus={handleTextareaFocus}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                } else if (e.key === 'e' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  onOptimize?.();
                }
              }}
              placeholder="Ask anything..."
              className={`${styles.textarea} textareaScroll`}
              style={{
                pointerEvents: isIntegrationPopupOpen ? 'none' : 'auto'
              }}
              suppressHydrationWarning
            />
          )}
          
          <div className={styles.buttonsContainer}>
            <div className={styles.toolButtons}>
              <button
                onClick={() => {
                  blurTextInput();
                }}
                className={`${styles.attachButton} ${styles.noPadding}`}
                title="Attach file">
                <AttachIcon />
              </button>
              <VoiceRecordingButton
                isRecording={voiceState.isRecording}
                isTranscribing={voiceState.isTranscribing}
                timeRemaining={voiceState.timeRemaining}
                mediaStream={mediaStream}
                onStartRecording={startRecording}
                onStopRecording={stopRecording}
                onBlur={blurTextInput}
              />
              <IntegrationButton
                onIntegrationSelect={onIntegrationSelect || (() => {})}
                activeIntegrations={activeIntegrations || []}
                onBlur={blurTextInput}
                onPopupStateChange={onIntegrationPopupStateChange}
                onCloseSidebar={onCloseSidebar}
                onCloseQueue={onCloseQueue}
              />
            </div>
            
            <div className={styles.actionButtons}>
              <OptimizeButton
                onClick={onOptimize}
                disabled={!inputText.trim() || isOptimizing}
              />
              
              <button
                onClick={onSend}
                disabled={!inputText.trim() || isOptimizing}
                className={`${styles.sendButton} ${
                  inputText.trim() && !isOptimizing
                    ? styles.sendButtonActive
                    : styles.sendButtonInactive
                }`}
                title={inputText.trim() ? 'Send message' : 'Type a message to send'}
              >
                <UpArrowIcon
                  className={
                    inputText.trim() && !isOptimizing ? styles.sendIconActive : styles.sendIconInactive
                  }
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {voiceState.error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>
            {voiceState.error}
          </p>
        </div>
      )}
    </>
  );
};