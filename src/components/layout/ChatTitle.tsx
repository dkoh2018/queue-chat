import { User } from '@supabase/supabase-js';

interface ChatTitleProps {
  user: User | null;
  variant?: 'desktop' | 'mobile';
}

export function ChatTitle({ user, variant = 'desktop' }: ChatTitleProps) {
  const firstName = user?.user_metadata?.first_name || user?.user_metadata?.full_name?.split(' ')[0] || 'there';
  
  const baseClasses = "font-semibold text-white leading-tight tracking-tight text-center";
  const sizeClasses = variant === 'desktop' 
    ? "text-3xl sm:text-4xl lg:text-5xl" 
    : "text-2xl sm:text-3xl";
  
  return (
    <h1 className={`${baseClasses} ${sizeClasses}`}>
      How can I help,{' '}
      <button className="hover:text-emerald-400 transition-colors">
        {firstName}
      </button>
      ?
    </h1>
  );
}
