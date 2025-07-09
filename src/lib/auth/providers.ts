import type { AuthProvider, OAuthProvider } from '@/types/auth';

// Provider configurations
export const authProviders: Record<OAuthProvider, AuthProvider> = {
  google: {
    id: 'google',
    name: 'Google',
    icon: 'google',
    color: '#4285F4',
    scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
    enabled: true,
  },
  github: {
    id: 'github',
    name: 'GitHub',
    icon: 'github',
    color: '#24292e',
    scopes: 'user:email',
    enabled: true,
  },
  apple: {
    id: 'apple',
    name: 'Apple',
    icon: 'apple',
    color: '#000000',
    enabled: false, // Requires paid developer account
  },
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    enabled: false, // Not implemented yet
  },
  discord: {
    id: 'discord',
    name: 'Discord',
    icon: 'discord',
    color: '#5865F2',
    enabled: false, // Not implemented yet
  },
};

// Helper functions
export const getProvider = (id: OAuthProvider): AuthProvider | undefined => {
  return authProviders[id];
};

export const getEnabledProviders = (): AuthProvider[] => {
  return Object.values(authProviders).filter(provider => provider.enabled);
};

export const isProviderEnabled = (id: OAuthProvider): boolean => {
  return authProviders[id]?.enabled ?? false;
};

// Provider-specific configurations
export const getProviderConfig = (provider: OAuthProvider) => {
  const config = authProviders[provider];
  if (!config) {
    throw new Error(`Provider ${provider} not found`);
  }

  const baseConfig = {
    redirectTo: `${window.location.origin}/auth/callback`,
  };

  switch (provider) {
    case 'google':
      return {
        ...baseConfig,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: config.scopes,
      };
    
    case 'github':
      return {
        ...baseConfig,
        scopes: config.scopes,
      };
    
    default:
      return baseConfig;
  }
};
