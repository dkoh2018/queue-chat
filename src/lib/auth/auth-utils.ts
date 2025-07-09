
import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import type { AuthenticatedUser } from '@/types/auth';
import { logger } from '@/utils';

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('No authorization header found', 'AUTH');
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      logger.error('Invalid token or user not found', 'AUTH', error);
      return null;
    }

    return {
      id: user.id,
      email: user.email!,
      name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
    };
  } catch (error) {
    logger.error('Error authenticating user', 'AUTH', error);
    return null;
  }
}

export function createUnauthorizedResponse() {
  return Response.json(
    { error: 'Unauthorized - Please sign in to access this resource' },
    { status: 401 }
  );
}

export function createForbiddenResponse() {
  return Response.json(
    { error: 'Forbidden - You can only access your own data' },
    { status: 403 }
  );
}

// Get user's OAuth providers
export async function getUserProviders(userId: string) {
  try {
    const { data: providers, error } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('provider, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      logger.error('Failed to get user providers', 'AUTH', error);
      return [];
    }

    return providers || [];
  } catch (error) {
    logger.error('Error getting user providers', 'AUTH', error);
    return [];
  }
}

// Get user's primary provider (first one they signed up with)
export async function getUserPrimaryProvider(userId: string): Promise<string | null> {
  const providers = await getUserProviders(userId);
  return providers.length > 0 ? providers[0].provider : null;
}

// Check if user has a specific provider
export async function userHasProvider(userId: string, provider: string): Promise<boolean> {
  const providers = await getUserProviders(userId);
  return providers.some(p => p.provider === provider);
}