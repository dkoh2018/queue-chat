import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { logger } from '@/utils';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
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

  const signOut = useCallback(async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        setError(error.message);
        logger.error('Sign out failed', 'AUTH', error);
      } else {
        logger.info('User signed out successfully', 'AUTH');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      logger.error('Sign out error', 'AUTH', err);
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