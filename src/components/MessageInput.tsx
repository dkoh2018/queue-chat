import { useRef, useEffect } from 'react';
import { AttachIcon, MicIcon } from '@/components/icons';
import { UpArrowIcon } from './icons/UpArrowIcon';

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
        
        {/* Textarea */}
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
            padding: '16px',
            fontSize: '15px',
            lineHeight: '1.5',
            wordBreak: 'break-word',
            minHeight: '36px',
            maxHeight: '192px',
            transition: 'height 0.2s ease'
          }}
        />
        
        {/* Buttons Container */}
        <div className="flex justify-between items-center p-2">
          {/* Tool Buttons */}
          <div className="flex items-center space-x-1">
            <button
              className="hover:bg-gray-600/50 rounded-full transition-colors opacity-70 hover:opacity-100 p-1.5"
              title="Attach file">
              <AttachIcon />
            </button>
            <button
              className="hover:bg-gray-600/50 rounded-full transition-colors opacity-70 hover:opacity-100 p-1.5"
              title="Voice input">
              <MicIcon />
            </button>
          </div>
          
          {/* Send Button */}
           <button
             onClick={onSend}
             disabled={!inputText.trim()}
             className={`rounded-full transition-all duration-200 w-8 h-8 flex items-center justify-center ${
               inputText.trim()
                 ? 'bg-white hover:bg-gray-200 shadow-md'
                 : 'bg-transparent'
             }`}
             title={inputText.trim() ? 'Send message' : 'Type a message to send'}
           >
             <UpArrowIcon
               className={
                 inputText.trim() ? 'text-black' : 'text-gray-400'
               }
             />
           </button>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="text-center mt-2">
        <p className="text-xs text-gray-500">
          Jarvis can make mistakes. Check important info.
        </p>
      </div>
    </>
  );
};