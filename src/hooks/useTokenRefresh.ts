import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/utils';

interface TokenState {
  token: string | null;
  isValid: boolean;
  isRefreshing: boolean;
  lastRefresh: number;
  error: string | null;
}

interface UseTokenRefreshReturn {
  providerToken: string | null;
  isTokenValid: boolean;
  isRefreshing: boolean;
  error: string | null;
  refreshToken: () => Promise<string | null>;
  validateToken: (token: string) => Promise<boolean>;
}

export const useTokenRefresh = (): UseTokenRefreshReturn => {
  const [tokenState, setTokenState] = useState<TokenState>({
    token: null,
    isValid: true, // Default to true - assume tokens are valid like test page
    isRefreshing: false,
    lastRefresh: 0,
    error: null
  });

  // Simplified token validation (optional, only when explicitly called)
  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    if (!token) return false;
    
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=1',
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      return response.ok;
    } catch (error) {
      logger.error('Token validation failed', 'TOKEN_REFRESH', error);
      return false;
    }
  }, []);

  // Simplified refresh - just get fresh session like test page
  const refreshToken = useCallback(async (): Promise<string | null> => {
    setTokenState(prev => ({ ...prev, isRefreshing: true, error: null }));
    
    try {
      // Simple session refresh like test page
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        logger.error('Session refresh failed', 'TOKEN_REFRESH', error);
        setTokenState(prev => ({ 
          ...prev, 
          isRefreshing: false, 
          error: 'Session refresh failed. Please sign in again.' 
        }));
        return null;
      }

      const newToken = session?.provider_token || null;
      
      if (newToken) {
        setTokenState({
          token: newToken,
          isValid: true, // Assume valid like test page
          isRefreshing: false,
          lastRefresh: Date.now(),
          error: null
        });
        
        logger.info('Token refreshed successfully', 'TOKEN_REFRESH', {
          tokenLength: newToken.length
        });
        
        return newToken;
      } else {
        setTokenState(prev => ({ 
          ...prev, 
          isRefreshing: false, 
          error: 'No provider token in session' 
        }));
        return null;
      }
    } catch (error) {
      logger.error('Token refresh error', 'TOKEN_REFRESH', error);
      setTokenState(prev => ({ 
        ...prev, 
        isRefreshing: false, 
        error: 'Token refresh failed. Please sign in again.' 
      }));
      return null;
    }
  }, []);

  // Get current token from session (same as test page)
  const getCurrentToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.provider_token || null;
    } catch (error) {
      logger.error('Failed to get current token', 'TOKEN_REFRESH', error);
      return null;
    }
  }, []);

  // Initialize token on mount (simplified)
  useEffect(() => {
    const initializeToken = async () => {
      const token = await getCurrentToken();
      if (token) {
        setTokenState({
          token,
          isValid: true, // Assume valid like test page
          isRefreshing: false,
          lastRefresh: Date.now(),
          error: null
        });
        
        logger.info('Token initialized', 'TOKEN_REFRESH', {
          tokenLength: token.length
        });
      }
    };

    initializeToken();
  }, [getCurrentToken]);

  // Listen for auth state changes (simplified)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' && session?.provider_token) {
          const newToken = session.provider_token;
          
          setTokenState({
            token: newToken,
            isValid: true, // Assume valid like test page
            isRefreshing: false,
            lastRefresh: Date.now(),
            error: null
          });
          
          logger.info('Token auto-refreshed', 'TOKEN_REFRESH', {
            tokenLength: newToken.length
          });
        } else if (event === 'SIGNED_OUT') {
          setTokenState({
            token: null,
            isValid: false,
            isRefreshing: false,
            lastRefresh: 0,
            error: null
          });
        } else if (event === 'SIGNED_IN' && session?.provider_token) {
          // Handle sign in
          setTokenState({
            token: session.provider_token,
            isValid: true,
            isRefreshing: false,
            lastRefresh: Date.now(),
            error: null
          });
          
          logger.info('Token set on sign in', 'TOKEN_REFRESH', {
            tokenLength: session.provider_token.length
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // REMOVED: Auto-refresh logic that was causing issues
  // The test page doesn't auto-refresh, so we shouldn't either

  return {
    providerToken: tokenState.token,
    isTokenValid: tokenState.isValid,
    isRefreshing: tokenState.isRefreshing,
    error: tokenState.error,
    refreshToken,
    validateToken
  };
}; 