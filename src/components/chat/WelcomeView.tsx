import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface WelcomeViewProps {
  user: User | null;
  authLoading: boolean;
}

export const WelcomeView = ({
  user,
  authLoading
}: WelcomeViewProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user's first name from Google metadata
  const getUserFirstName = () => {
    if (authLoading) return 'there';
    if (!user) return 'there';
    
    // Try to get first name from user metadata
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) {
      return fullName.split(' ')[0];
    }
    
    // Fallback to email username
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    return 'there';
  };

  const getStatusMessage = () => {
    if (authLoading) {
      return '🔄 Loading...';
    }
    return '✨ New chat started - Ask me anything!';
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 pb-32 min-h-0">
      <div className="text-center max-w-2xl w-full">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-white mb-6 leading-tight tracking-tight">
          How can I help, <button className="hover:text-emerald-400 transition-colors">{getUserFirstName()}</button>?
        </h1>
        {mounted && (
          <div className="flex justify-center w-full">
            <div className="inline-flex items-center px-4 py-2 border rounded-full bg-emerald-500/10 border-emerald-400/20">
              <span className="text-sm font-medium text-emerald-300">
                {getStatusMessage()}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};