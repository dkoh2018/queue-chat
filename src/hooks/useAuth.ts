import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/utils';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: (clearAppData?: () => void) => Promise<void>;
}

export const useAuth = (): UseAuthReturn => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Failed to get initial session', 'AUTH', error);
        setError(error.message);
      } else {
        setUser(session?.user ?? null);
        logger.info('Initial session loaded', 'AUTH', { hasUser: !!session?.user });
      }
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      logger.info('Auth state changed', 'AUTH', { event, hasUser: !!session?.user });
      
      setUser(session?.user ?? null);
      setError(null);
      
      if (event === 'SIGNED_IN' && session?.user) {
        // Create or update user in our database
        await createOrUpdateUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateUser = async (authUser: User) => {
    try {
      // Check if user exists in our database
      const response = await fetch('/api/auth/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.full_name || authUser.user_metadata?.name,
          avatar_url: authUser.user_metadata?.avatar_url,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create/update user');
      }

      logger.info('User created/updated in database', 'AUTH', { userId: authUser.id });
    } catch (err) {
      logger.error('Failed to create/update user in database', 'AUTH', err);
    }
  };

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        setError(error.message);
        logger.error('Google sign-in failed', 'AUTH', error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in';
      setError(errorMessage);
      logger.error('Google sign-in error', 'AUTH', err);
    }
  }, []);

  const signOut = useCallback(async (clearAppData?: () => void) => {
    try {
      setError(null);
      
      // Clear user state immediately for security
      setUser(null);
      
      // Clear app data (conversations, messages, etc.)
      if (clearAppData) {
        clearAppData();
      }
      
      // Clear all localStorage data related to the user
      if (typeof window !== 'undefined') {
        // Clear conversation-related localStorage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('scroll-') || key.startsWith('conversation-') || key.startsWith('user-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear any other sensitive data
        localStorage.removeItem('lastConversationId');
        localStorage.removeItem('currentUser');
        sessionStorage.clear(); // Clear all session storage
      }
      
      // Sign out from Supabase (this clears auth cookies/tokens)
      const { error } = await supabase.auth.signOut({
        scope: 'global' // This ensures logout from all sessions/devices
      });
      
      if (error) {
        setError(error.message);
        logger.error('Sign out failed', 'AUTH', error);
      } else {
        logger.info('User signed out successfully - all data cleared', 'AUTH');
        
        // Force a page reload to ensure complete cleanup
        if (typeof window !== 'undefined') {
          window.location.reload();
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      logger.error('Sign out error', 'AUTH', err);
      
      // Even if there's an error, clear local state for security
      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    }
  }, []);

  return {
    user,
    loading,
    error,
    signInWithGoogle,
    signOut,
  };
};