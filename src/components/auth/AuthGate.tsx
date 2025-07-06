'use client';

import { useAuth } from '@/hooks';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { LoginPage } from './LoginPage';

interface AuthGateProps {
  children: React.ReactNode;
}

export const AuthGate = ({ children }: AuthGateProps) => {
  const { user, loading } = useAuth();

  // Show loading screen while checking authentication
  if (loading) {
    return <LoadingScreen />;
  }

  // Show login page if user is not authenticated
  if (!user) {
    return <LoginPage />;
  }

  // User is authenticated, render the main app
  return <>{children}</>;
};