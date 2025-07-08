import { useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';

interface WelcomeViewProps {
  user: User | null;
  hideStatusBadge?: boolean;
}

export const WelcomeView = ({
  user,
  hideStatusBadge = false
}: WelcomeViewProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get user's first name from Google metadata
  const getUserFirstName = () => {
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
    return '✨ New chat started - Ask me anything!';
  };

  return (
    <div className={`flex-1 flex flex-col items-center px-4 sm:px-6 lg:px-8 min-h-0 ${hideStatusBadge ? 'justify-center pb-32' : 'justify-center pb-32'}`}>
      <div className="text-center w-full mx-auto">
        <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight tracking-tight ${hideStatusBadge ? 'mb-2' : 'mb-6'} px-2`}>
          How can I help, <button className="hover:text-emerald-400 transition-colors">{getUserFirstName()}</button>?
        </h1>
        {mounted && !hideStatusBadge && (
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