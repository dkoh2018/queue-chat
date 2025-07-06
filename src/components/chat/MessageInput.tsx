import { useRef, useEffect } from 'react';
import { AttachIcon } from '@/components/icons';
import { UpArrowIcon } from '@/components/icons';
import OptimizeButton from '@/components/features/OptimizeButton';
import { TypingDots } from '@/components/ui/TypingDots';
import { VoiceRecordingButton } from '@/components/features/VoiceRecordingButton';
import { IntegrationButton } from '@/components/features/IntegrationButton';
import { useVoiceRecording } from '@/hooks';
import { IntegrationType } from '@/types';

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
      <div className="message-input-container relative" style={{ borderRadius: '12px' }}>
        {/* Background layer with glass effect */}
        <div
          className="message-input-background absolute inset-0 bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 shadow-lg transition-all duration-200 hover:border-gray-500/60"
          style={{
            borderRadius: '12px'
          }}
        />
        
        {/* Content layer - isolated from backdrop filter */}
        <div className="message-input-content relative flex flex-col">
          {/* Textarea or Loading State */}
          {isOptimizing ? (
            <div
              className="w-full text-white placeholder-gray-400 bg-transparent resize-none border-none outline-none focus:outline-none font-medium flex items-center"
              style={{
                padding: '20px',
                fontSize: '16px',
                lineHeight: '1.5',
                height: '60px',
              }}
            >
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
              className="w-full text-white placeholder-gray-400 resize-none border-none outline-none focus:outline-none font-medium"
              suppressHydrationWarning
              style={{
                padding: '20px',
                fontSize: '16px',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                height: '60px', // Base height
                background: 'transparent',
                position: 'relative',
                transition: 'height 0.15s ease', // Smoother transition
              }}
            />
          )}
          
          {/* Buttons Container */}
          <div className="flex justify-between items-center p-2">
            {/* Tool Buttons */}
            <div className="flex items-center space-x-1">
              <button
                className="hover:bg-gray-600/50 rounded-full transition-colors opacity-70 hover:opacity-100 p-1.5"
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
            <div className="flex items-center space-x-2">
              {/* Optimize Button */}
              <OptimizeButton
                onClick={onOptimize}
                disabled={!inputText.trim() || isOptimizing}
              />
              
              {/* Send Button */}
              <button
                onClick={onSend}
                disabled={!inputText.trim() || isOptimizing}
                className={`rounded-full transition-all duration-200 w-8 h-8 flex items-center justify-center ${
                  inputText.trim() && !isOptimizing
                    ? 'bg-white hover:bg-gray-200 shadow-md'
                    : 'bg-transparent'
                }`}
                title={inputText.trim() ? 'Send message' : 'Type a message to send'}
              >
                <UpArrowIcon
                  className={
                    inputText.trim() && !isOptimizing ? 'text-black' : 'text-gray-400'
                  }
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Voice Recording Error */}
      {voiceState.error && (
        <div className="mt-2 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-xs text-red-400 text-center">
            {voiceState.error}
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="text-center mt-2">
        <p className="text-xs text-gray-500">
          Jarvis can make mistakes.
        </p>
      </div>
    </>
  );
};