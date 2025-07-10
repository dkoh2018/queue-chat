import { useRef, useEffect, useCallback } from 'react';
import { AttachIcon } from '@/components/icons';
import { UpArrowIcon } from '@/components/icons';
import OptimizeButton from '@/components/features/OptimizeButton';
import { TypingDots } from '@/components/ui/TypingDots';
import { VoiceRecordingButton } from '@/components/features/VoiceRecordingButton';
import { IntegrationButton } from '@/components/features/IntegrationButton';
import { useVoiceRecording } from '@/hooks';
import { IntegrationType } from '@/types';
import { UI_CONSTANTS } from '@/utils/constants';
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
  hideDisclaimer?: boolean;
}

export const MessageInput = ({ inputText, setInputText, onSend, onOptimize, isOptimizing = false, onIntegrationSelect, activeIntegrations, onFocus, isIntegrationPopupOpen = false, onIntegrationPopupStateChange, onCloseSidebar, onCloseQueue, hideDisclaimer = false }: MessageInputProps) => {
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
    const newValue = e.target.value;
    const maxLength = UI_CONSTANTS.MAX_MESSAGE_LENGTH + 25;
    
    const truncatedValue = newValue.length > maxLength ? newValue.slice(0, maxLength) : newValue;
    
    setInputText(truncatedValue);
    resizeTextarea();
  }, [setInputText, resizeTextarea]);

  const blurTextInput = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.blur();
    }
  }, []);

  const getCharacterWarning = () => {
    const length = inputText.length;
    const maxLength = UI_CONSTANTS.MAX_MESSAGE_LENGTH;
    const hardLimit = maxLength + 25;
    
    if (length >= hardLimit) {
      return {
        show: true,
        type: 'error',
        message: `Maximum character limit reached (${length}/${hardLimit}). Text will be automatically truncated.`,
        color: 'text-red-400'
      };
    } else if (length > maxLength) { 
      return {
        show: true,
        type: 'error',
        message: `Message too long (${length}/${maxLength} characters). Please shorten your message.`,
        color: 'text-red-400'
      };
    }
    return { show: false };
  };

  const characterWarning = getCharacterWarning();

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
                disabled={!inputText.trim() || isOptimizing || characterWarning.type === 'error'}
                className={`${styles.sendButton} ${
                  inputText.trim() && !isOptimizing && characterWarning.type !== 'error'
                    ? styles.sendButtonActive
                    : styles.sendButtonInactive
                }`}
                title={
                  characterWarning.type === 'error' 
                    ? 'Message too long - please shorten it'
                    : inputText.trim() 
                    ? 'Send message' 
                    : 'Type a message to send'
                }
              >
                <UpArrowIcon
                  className={
                    inputText.trim() && !isOptimizing && characterWarning.type !== 'error' 
                      ? styles.sendIconActive 
                      : styles.sendIconInactive
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

      {characterWarning.show && (
        <div className={`${styles.errorContainer} ${characterWarning.type === 'warning' ? styles.warningContainer : ''}`}>
          <p className={`${styles.errorText} ${characterWarning.color}`}>
            {characterWarning.message}
          </p>
        </div>
      )}

      {!hideDisclaimer && (
        <div className={styles.disclaimer}>
          <p className={styles.disclaimerText}>
            Jarvis can make mistakes.
          </p>
        </div>
      )}
    </>
  );
};