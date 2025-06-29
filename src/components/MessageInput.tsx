import { useRef, useEffect } from 'react';
import { AttachIcon, MicIcon, VoiceIcon, SendIcon } from '@/components/icons';

interface MessageInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  onSend: () => void;
}

export const MessageInput = ({ inputText, setInputText, onSend }: MessageInputProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        return;
      }
      
      // Calculate needed height based on content
      const scrollHeight = textarea.scrollHeight;
      const newHeight = Math.min(Math.max(scrollHeight, minHeight), maxHeight);
      
      textarea.style.height = `${newHeight}px`;
      
      // Enable scrolling only when max height is reached
      if (scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [inputText]);

  return (
    <>
      {/* Floating container at bottom - ChatGPT style */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-transparent p-4">
        <div className="max-w-4xl mx-auto">
          {/* Single unified input component with curved edges */}
          <div className="relative bg-gray-800/60 backdrop-blur-sm border border-gray-600/50 shadow-lg transition-all duration-200 hover:border-gray-500/60 focus-within:border-emerald-400/60 focus-within:shadow-emerald-500/20"
               style={{ borderRadius: '12px' }}>
            
            {/* Textarea - fills container with padding for buttons */}
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              placeholder="Ask anything..."
              className="w-full text-white placeholder-gray-400 bg-transparent resize-none border-none outline-none focus:outline-none font-medium"
              style={{ 
                padding: '16px 60px 16px 60px', // Space for buttons on both sides
                fontSize: '15px',
                lineHeight: '1.5',
                wordBreak: 'break-word',
                minHeight: '36px', // Compact start (~1.5 lines)
                maxHeight: '192px', // 8 lines max
                transition: 'height 0.2s ease' // Smooth height transitions
              }}
            />
            
            {/* Send button - absolutely positioned inside textarea bottom-right */}
            <button
              onClick={onSend}
              disabled={!inputText.trim()}
              className="absolute bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-full transition-all duration-200 shadow-sm hover:shadow-md disabled:shadow-none"
              style={{
                bottom: '8px',
                right: '8px',
                padding: '6px',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title={inputText.trim() ? 'Send message' : 'Type a message to send'}
            >
              <SendIcon />
            </button>
            
            {/* Tool buttons - absolutely positioned inside textarea bottom-left */}
            <div className="absolute flex items-center space-x-1"
                 style={{
                   bottom: '8px',
                   left: '8px'
                 }}>
              <button 
                className="hover:bg-gray-600/50 rounded-full transition-colors opacity-70 hover:opacity-100"
                style={{
                  padding: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Attach file">
                <AttachIcon />
              </button>
              <button 
                className="hover:bg-gray-600/50 rounded-full transition-colors opacity-70 hover:opacity-100"
                style={{
                  padding: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Voice input">
                <MicIcon />
              </button>
              <button 
                className="hover:bg-gray-600/50 rounded-full transition-colors opacity-70 hover:opacity-100"
                style={{
                  padding: '6px',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Voice mode">
                <VoiceIcon />
              </button>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">
              Jarvis can make mistakes. Check important info.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};