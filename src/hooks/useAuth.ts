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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        logger.error('Failed to get initial session', 'AUTH', error);
        setError(error.message);
        setUser(null);
      } else {
        setUser(session?.user ?? null);
        logger.debug('Session initialized', 'AUTH', {
          hasUser: !!session?.user,
          hasAccessToken: !!session?.access_token,
          sessionExpiry: session?.expires_at
        });
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        logger.info(`User ${event.toLowerCase().replace('_', ' ')}`, 'AUTH', {
          event,
          hasUser: !!session?.user,
          hasAccessToken: !!session?.access_token
        });
      }

      if (event === 'TOKEN_REFRESHED' && !session) {
        logger.error('Token refresh failed - session is null', 'AUTH');
        setUser(null);
        setError('Session expired - please sign in again');
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        return;
      }

      setUser(session?.user ?? null);
      setError(null);

      if (event === 'SIGNED_IN' && session?.user) {
        if (session.provider_token) {
          logger.debug('OAuth tokens received', 'AUTH', {
            tokenLength: session.provider_token.length,
            hasRefreshToken: !!session.provider_refresh_token
          });
        }

        await createOrUpdateUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const createOrUpdateUser = async (authUser: User) => {
    try {
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
        const errorText = await response.text();
        logger.error('API response error', 'AUTH', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        });
        throw new Error(`Failed to create/update user: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      logger.info('User created/updated in database', 'AUTH', { userId: authUser.id, result });
    } catch (err) {
      logger.error('Failed to create/update user in database', 'AUTH', {
        error: err instanceof Error ? err.message : 'Unknown error',
        userId: authUser.id,
        userEmail: authUser.email
      });
    }
  };

  const signInWithGoogle = useCallback(async () => {
    try {
      setError(null);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events'
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

      setUser(null);

      if (clearAppData) {
        clearAppData();
      }

      if (typeof window !== 'undefined') {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('scroll-') || key.startsWith('conversation-') || key.startsWith('user-'))) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        localStorage.removeItem('lastConversationId');
        localStorage.removeItem('currentUser');
        sessionStorage.clear();
      }

      const { error } = await supabase.auth.signOut({
        scope: 'global'
      });

      if (error) {
        setError(error.message);
        logger.error('Sign out failed', 'AUTH', error);
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      } else {
        logger.info('User signed out successfully - all data cleared', 'AUTH');

        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign out';
      setError(errorMessage);
      logger.error('Sign out error', 'AUTH', err);

      setUser(null);
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/login';
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