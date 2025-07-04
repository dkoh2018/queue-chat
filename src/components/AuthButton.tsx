'use client';

import { useAuth } from '@/hooks/useAuth';

interface AuthButtonProps {
  className?: string;
}

export default function AuthButton({ className = '' }: AuthButtonProps) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  const handleAuthClick = async () => {
    if (user) {
      await signOut();
    } else {
      await signInWithGoogle();
    }
  };

  const getInitials = (name: string | undefined): string => {
    if (!name) return 'PP';
    const names = name.split(' ').filter(n => n.length > 0);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getUserDisplayName = () => {
    return user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const getUserInitials = () => {
    if (!user) return 'PP'; // Default for anonymous users
    
    // Try to get initials from full name first
    const fullName = user.user_metadata?.full_name || user.user_metadata?.name;
    if (fullName) {
      return getInitials(fullName);
    }
    
    // Fallback to email-based initials
    if (user.email) {
      const emailUsername = user.email.split('@')[0];
      return getInitials(emailUsername);
    }
    
    return 'U'; // Ultimate fallback
  };

  if (loading) {
    return (
      <div className={`w-10 h-10 rounded-full glass-button flex items-center justify-center ${className}`}>
        <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <button
      onClick={handleAuthClick}
      className={`w-10 h-10 rounded-full glass-button flex items-center justify-center text-white font-semibold text-xs transition-all duration-200 hover:glass-glow-red ${className} relative overflow-hidden group`}
      title={user ? `Click to logout (${getUserDisplayName()})` : 'Login with Google'}
    >
      {user ? (
        <>
          {user.user_metadata?.avatar_url ? (
            <img
              src={user.user_metadata.avatar_url}
              alt="Profile"
              className="w-full h-full rounded-full object-cover group-hover:opacity-70 transition-opacity"
            />
          ) : (
            <span className="text-xs font-bold group-hover:opacity-70 transition-opacity">
              {getUserInitials()}
            </span>
          )}
          {/* Logout indicator on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/20 rounded-full">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
        </>
      ) : (
        <span className="text-xs font-bold">PP</span>
      )}
    </button>
  );
}