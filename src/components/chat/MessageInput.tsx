import { useRef, useEffect } from 'react';
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
}

export const MessageInput = ({ inputText, setInputText, onSend, onOptimize, isOptimizing = false, onIntegrationSelect, activeIntegrations }: MessageInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTranscriptionRef = useRef<string | undefined>(undefined);
  
  // Voice recording functionality
  const {
    state: voiceState,
    mediaStream,
    startRecording,
    stopRecording
  } = useVoiceRecording();

  // Handle voice transcription completion
  useEffect(() => {
    if (voiceState.rawTranscription && voiceState.rawTranscription !== lastTranscriptionRef.current) {
      // Append transcribed text to existing input (don't replace)
      const newText = inputText ? `${inputText} ${voiceState.rawTranscription}` : voiceState.rawTranscription;
      setInputText(newText);
      lastTranscriptionRef.current = voiceState.rawTranscription;
    }
  }, [voiceState.rawTranscription, inputText, setInputText]);

  // Simplified auto-resize - less jumpy, more stable
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Start with a comfortable base height
      const baseHeight = 60; // Fixed base height
      const maxHeight = 160;  // Max height before scrolling
      
      // Calculate if content would naturally overflow the base height
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      
      // Only grow if content naturally exceeds base height + some buffer
      const buffer = 10; // Small buffer to prevent premature growth
      if (scrollHeight > baseHeight + buffer) {
        const newHeight = Math.min(scrollHeight, maxHeight);
        textarea.style.height = `${newHeight}px`;
        
        if (newHeight >= maxHeight) {
          textarea.style.overflowY = 'auto';
        } else {
          textarea.style.overflowY = 'hidden';
        }
      } else {
        // Keep base height for content that fits comfortably
        textarea.style.height = `${baseHeight}px`;
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [inputText]);

  return (
    <>
      {/* Container with backdrop filter - separated from text input */}
      <div className={styles.container}>
        {/* Background layer with glass effect */}
        <div className={styles.background} />
        
        {/* Content layer - isolated from backdrop filter */}
        <div className={styles.content}>
          {/* Textarea or Loading State */}
          {isOptimizing ? (
            <div className={styles.loadingContainer}>
              <TypingDots />
            </div>
          ) : (
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
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
              suppressHydrationWarning
            />
          )}
          
          {/* Buttons Container */}
          <div className={styles.buttonsContainer}>
            {/* Tool Buttons */}
            <div className={styles.toolButtons}>
              <button
                className={styles.attachButton}
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
              />
              <IntegrationButton
                onIntegrationSelect={onIntegrationSelect || (() => {})}
                activeIntegrations={activeIntegrations || []}
              />
            </div>
            
            {/* Action Buttons */}
            <div className={styles.actionButtons}>
              {/* Optimize Button */}
              <OptimizeButton
                onClick={onOptimize}
                disabled={!inputText.trim() || isOptimizing}
              />
              
              {/* Send Button */}
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

      {/* Voice Recording Error */}
      {voiceState.error && (
        <div className={styles.errorContainer}>
          <p className={styles.errorText}>
            {voiceState.error}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className={styles.disclaimer}>
        <p className={styles.disclaimerText}>
          Jarvis can make mistakes.
        </p>
      </div>
    </>
  );
};