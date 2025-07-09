import type { User } from '@supabase/supabase-js';

// OAuth Provider Types
export type OAuthProvider = 'google' | 'github' | 'apple' | 'facebook' | 'discord';

export interface AuthProvider {
  id: OAuthProvider;
  name: string;
  icon: string;
  color: string;
  scopes?: string;
  enabled: boolean;
}

// Auth Hook Return Types
export interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithProvider: (provider: OAuthProvider) => Promise<void>;
  signOut: (clearAppData?: () => void) => Promise<void>;
}

// Auth Provider Hook Types
export interface UseAuthProvidersReturn {
  providers: AuthProvider[];
  enabledProviders: AuthProvider[];
  getProvider: (id: OAuthProvider) => AuthProvider | undefined;
  isProviderEnabled: (id: OAuthProvider) => boolean;
}

// Server-side Auth Types (moved from auth-utils.ts)
export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
  primary_provider?: string;
  providers?: string[];
}

// OAuth Token Types
export interface UserOAuthToken {
  id: string;
  user_id: string;
  provider: string;
  provider_token: string;
  provider_refresh_token?: string;
  token_expires_at?: string;
  scopes?: string;
  created_at: string;
  updated_at: string;
}

// Auth Button Props
export interface AuthButtonProps {
  provider: AuthProvider;
  onClick: () => Promise<void>;
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

// Provider Button Props
export interface ProviderButtonProps {
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => Promise<void>;
}
