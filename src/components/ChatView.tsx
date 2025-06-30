import { UIMessage } from '@/types';
import MarkdownMessage from '@/components/MarkdownMessage';

interface ChatViewProps {
  messages: UIMessage[];
}

export const ChatView = ({ messages }: ChatViewProps) => {
  return (
    <div className="flex-1 flex flex-col overflow-y-auto chat-scroll px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-4xl w-full mx-auto space-y-12 pb-48">
        {messages?.map((msg, index) => (
          <div
            key={index}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-8`}
          >
            <div className={`${
              msg.role === 'user'
                ? 'bg-gray-800 text-white rounded-2xl rounded-br-md px-5 py-3 border border-gray-700/50 max-w-[85%] shadow-lg'
                : 'text-gray-100 w-full'
            }`}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-invert prose-lg max-w-none">
                  <MarkdownMessage content={msg.content} />
                </div>
              ) : (
                <div className="text-[15px] leading-relaxed font-medium whitespace-pre-wrap break-words">
                  {msg.content}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};