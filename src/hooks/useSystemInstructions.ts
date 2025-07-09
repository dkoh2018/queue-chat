import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface UseCustomPromptReturn {
  systemInstructions: string;
  hasCustomInstructions: boolean;
  setSystemInstructions: (instructions: string) => void;
  clearSystemInstructions: () => void;
  isLoading: boolean;
}

// Helper function to get auth headers (same as chat service)
const getAuthHeaders = async (): Promise<HeadersInit> => {
  const { data: { session } } = await supabase.auth.getSession();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  return headers;
};

export const useCustomPrompt = (): UseCustomPromptReturn => {
  const [systemInstructions, setSystemInstructionsState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from database on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const headers = await getAuthHeaders();
        const response = await fetch('/api/user-preferences', { headers });

        if (response.ok) {
          const data = await response.json();
          setSystemInstructionsState(data.customSystemInstructions || '');
        } else {
          console.error('❌ Failed to load preferences, status:', response.status);
        }
      } catch (error) {
        console.error('Failed to load user preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, []);

  const setSystemInstructions = useCallback(async (instructions: string) => {
    const trimmed = instructions.trim();
    setSystemInstructionsState(trimmed);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customSystemInstructions: trimmed || null
        }),
      });

      if (response.ok) {
        console.log('✅ Successfully saved system instructions to database');
      } else {
        console.error('❌ Failed to save system instructions, status:', response.status);
      }
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }, []);

  const clearSystemInstructions = useCallback(async () => {
    setSystemInstructionsState('');

    try {
      const headers = await getAuthHeaders();
      await fetch('/api/user-preferences', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          customSystemInstructions: null
        }),
      });
    } catch (error) {
      console.error('Failed to clear user preferences:', error);
    }
  }, []);

  return {
    systemInstructions,
    hasCustomInstructions: systemInstructions.length > 0,
    setSystemInstructions,
    clearSystemInstructions,
    isLoading,
  };
};

// Export with old name for backward compatibility
export const useSystemInstructions = useCustomPrompt;
