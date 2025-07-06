import { useRef, useEffect } from 'react';
import { AttachIcon } from '@/components/icons';
import { UpArrowIcon } from '@/components/icons';
import OptimizeButton from '@/components/features/optimization/OptimizeButton';
import { TypingDots } from '@/components/ui/TypingDots';
import { VoiceRecordingButton } from '@/components/features/voice/VoiceRecordingButton';
import { IntegrationButton } from '@/components/features/integrations/IntegrationButton';
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

  // Auto-resize textarea with line-by-line expansion
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Reset height to minimum to get accurate scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate line height more precisely
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseInt(computedStyle.lineHeight);
      
      // Define compact heights (ChatGPT-style)
      const minHeight = lineHeight * 1.5; // Start very compact (~1.5 lines)
      const maxHeight = lineHeight * 8; // Max 8 lines before scroll
      
      // If no content, use minimum height
      if (!inputText.trim()) {
        textarea.style.height = `${minHeight}px`;
        textarea.style.overflowY = 'hidden';
        return;
      }
      
      // Calculate needed height based on content
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      
      textarea.style.height = `${newHeight}px`;
      
      // Enable scrolling only when max height is reached
      if (newHeight >= maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [inputText]);

  return (
    <>
      {/* Single unified input component with curved edges */}
      <div className="flex flex-col bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 shadow-lg transition-all duration-200 hover:border-gray-500/60 focus-within:border-emerald-400/60 focus-within:shadow-emerald-500/20"
           style={{ borderRadius: '12px' }}>
        
        {/* Textarea or Loading State */}
        {isOptimizing ? (
          <div 
            className="w-full text-white placeholder-gray-400 bg-transparent resize-none border-none outline-none focus:outline-none font-medium flex items-center"
            style={{
              padding: '20px',
              fontSize: '16px',
              lineHeight: '1.5',
              minHeight: '55px',
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
              minHeight: '55px',
              maxHeight: '240px',
              transition: 'height 0.2s ease',
              background: 'rgba(31, 41, 55, 0.01)',
              position: 'relative',
              zIndex: 10
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