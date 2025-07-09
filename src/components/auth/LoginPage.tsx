'use client';

import { useAuth } from '@/hooks';
import { GoogleAuthButton } from './providers/GoogleAuthButton';
import { GitHubAuthButton } from './providers/GitHubAuthButton';

export const LoginPage = () => {
  const { signInWithGoogle, signInWithGitHub, loading, error } = useAuth();

  const handleGoogleSignIn = async () => {
    await signInWithGoogle();
  };

  const handleGitHubSignIn = async () => {
    await signInWithGitHub();
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#161618' }}>
      <div className="w-full max-w-lg space-y-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white">Log into your account</h1>
        </div>

        <div className="space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <p className="text-red-400 text-sm text-center">{error}</p>
            </div>
          )}

          <GoogleAuthButton
            loading={loading}
            onClick={handleGoogleSignIn}
          />

          <GitHubAuthButton
            loading={loading}
            onClick={handleGitHubSignIn}
          />
        </div>
      </div>
    </div>
  );
};