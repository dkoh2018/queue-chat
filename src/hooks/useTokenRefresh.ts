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
    isValid: false,
    isRefreshing: false,
    lastRefresh: 0,
    error: null
  });

  // Validate token by making a test API call
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

  // Refresh token by getting fresh session
  const refreshToken = useCallback(async (): Promise<string | null> => {
    setTokenState(prev => ({ ...prev, isRefreshing: true, error: null }));
    
    try {
      // Force refresh the session
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
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
        // Validate the new token
        const isValid = await validateToken(newToken);
        
        setTokenState({
          token: newToken,
          isValid,
          isRefreshing: false,
          lastRefresh: Date.now(),
          error: isValid ? null : 'Token validation failed'
        });
        
        logger.info('Token refreshed successfully', 'TOKEN_REFRESH', {
          tokenLength: newToken.length,
          isValid
        });
        
        return isValid ? newToken : null;
      } else {
        setTokenState(prev => ({ 
          ...prev, 
          isRefreshing: false, 
          error: 'No provider token in refreshed session' 
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
  }, [validateToken]);

  // Get current token from session
  const getCurrentToken = useCallback(async (): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.provider_token || null;
    } catch (error) {
      logger.error('Failed to get current token', 'TOKEN_REFRESH', error);
      return null;
    }
  }, []);

  // Initialize token on mount
  useEffect(() => {
    const initializeToken = async () => {
      const token = await getCurrentToken();
      if (token) {
        const isValid = await validateToken(token);
        setTokenState({
          token,
          isValid,
          isRefreshing: false,
          lastRefresh: Date.now(),
          error: isValid ? null : 'Token validation failed'
        });
      }
    };

    initializeToken();
  }, [getCurrentToken, validateToken]);

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'TOKEN_REFRESHED' && session?.provider_token) {
          const newToken = session.provider_token;
          const isValid = await validateToken(newToken);
          
          setTokenState({
            token: newToken,
            isValid,
            isRefreshing: false,
            lastRefresh: Date.now(),
            error: isValid ? null : 'Token validation failed'
          });
          
          logger.info('Token auto-refreshed', 'TOKEN_REFRESH', {
            tokenLength: newToken.length,
            isValid
          });
        } else if (event === 'SIGNED_OUT') {
          setTokenState({
            token: null,
            isValid: false,
            isRefreshing: false,
            lastRefresh: 0,
            error: null
          });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [validateToken]);

  // Auto-refresh token if it's invalid and not currently refreshing
  useEffect(() => {
    if (tokenState.token && !tokenState.isValid && !tokenState.isRefreshing) {
      const autoRefresh = async () => {
        // Only auto-refresh if last refresh was more than 5 minutes ago
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        if (tokenState.lastRefresh < fiveMinutesAgo) {
          await refreshToken();
        }
      };

      autoRefresh();
    }
  }, [tokenState.token, tokenState.isValid, tokenState.isRefreshing, tokenState.lastRefresh, refreshToken]);

  return {
    providerToken: tokenState.token,
    isTokenValid: tokenState.isValid,
    isRefreshing: tokenState.isRefreshing,
    error: tokenState.error,
    refreshToken,
    validateToken
  };
}; 