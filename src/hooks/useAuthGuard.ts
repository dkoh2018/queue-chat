import { useAuth } from './useAuth';
import { LoadingScreen } from '@/components/ui';


export function useAuthGuard() {
  const { user, loading } = useAuth();

  // Show loading while auth is initializing - prevents "free mode" flash
  if (loading) {
    return { user: null, AuthGuardComponent: LoadingScreen };
  }
  
  // This should never happen due to middleware, but security safety check
  if (!user) {
    return { user: null, AuthGuardComponent: () => null }; // No temporary access - redirect handled by middleware
  }

  return { user, AuthGuardComponent: null };
}
