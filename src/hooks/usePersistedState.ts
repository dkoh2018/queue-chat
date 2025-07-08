import { useState, useEffect } from 'react';

/**
 * React hook that syncs a piece of state with localStorage.
 * Works in SSR environments: falls back to the provided default value until the client hydrates.
 *
 * @param key localStorage key
 * @param defaultValue fallback when nothing in storage or parse fails
 */
export function usePersistedState<T>(key: string, defaultValue: T) {
  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        return JSON.parse(stored) as T;
      }
    } catch {
      /* ignore bad JSON */
    }
    return defaultValue;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* write may fail in private mode; ignore */
    }
  }, [key, state]);

  return [state, setState] as const;
}
