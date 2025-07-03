import { useState, useEffect } from 'react';

interface WelcomeViewProps {
  currentConversationId: string | null;
}

export const WelcomeView = ({ currentConversationId }: WelcomeViewProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-32 min-h-0">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-6 leading-tight tracking-tight">
          How can I help, <button className="hover:text-emerald-400 transition-colors">David</button>?
        </h1>
        {mounted && !currentConversationId && (
          <div className="flex justify-center w-full">
            <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full">
              <span className="text-emerald-300 text-sm font-medium">
                ✨ New chat started - Ask me anything!
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};