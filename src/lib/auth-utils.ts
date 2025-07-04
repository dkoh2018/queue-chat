import { NextRequest } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/utils';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
  avatar_url?: string;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.error('No authorization header found', 'AUTH');
      return null;
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token with Supabase
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