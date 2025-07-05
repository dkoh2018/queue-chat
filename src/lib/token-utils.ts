import { supabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/utils';

/**
 * Get Google access token for a user - uses multiple fallback methods
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    logger.info('Retrieving Google access token', 'TOKEN', { userId });

    // METHOD 1: Try to get from user identities (Supabase auth)
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      logger.error('Failed to get user for token retrieval', 'TOKEN', userError);
      return null;
    }

    // Check Google identity for provider token
    const googleIdentity = user.identities?.find(identity => identity.provider === 'google');
    
    if (googleIdentity?.identity_data?.provider_token) {
      const token = googleIdentity.identity_data.provider_token;
      logger.info('Successfully retrieved token from identity_data', 'TOKEN', { 
        userId, 
        tokenLength: token.length 
      });
      return token;
    }

    // METHOD 2: Try to get from database (fallback)
    const { data: tokens, error: tokensError } = await supabaseAdmin
      .from('user_oauth_tokens')
      .select('provider_token')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .not('provider_token', 'eq', 'mock_access_token_for_testing') // Exclude mock tokens
      .order('updated_at', { ascending: false })
      .limit(1);
    
    if (!tokensError && tokens && tokens.length > 0) {
      const token = tokens[0].provider_token;
      logger.info('Successfully retrieved token from database', 'TOKEN', { 
        userId, 
        tokenLength: token.length 
      });
      return token;
    }

    logger.warn('No Google access token found - user may need to sign in again', 'TOKEN', { 
      userId,
      hasGoogleIdentity: !!googleIdentity,
      identityDataKeys: googleIdentity?.identity_data ? Object.keys(googleIdentity.identity_data) : [],
      databaseTokens: tokens?.length || 0,
      suggestion: 'User should sign out and sign in again to refresh OAuth tokens'
    });
    
    return null;
    
  } catch (error) {
    logger.error('Failed to get Google access token', 'TOKEN', error);
    return null;
  }
}

/**
 * Get Google access token from frontend session (for endpoints that receive it)
 */
export async function getGoogleAccessTokenFromSession(sessionToken: string): Promise<string | null> {
  try {
    // This is for endpoints that receive the token from the frontend session
    // like your working test endpoint
    if (sessionToken && sessionToken.length > 0) {
      logger.info('Using token from frontend session', 'TOKEN', { 
        tokenLength: sessionToken.length 
      });
      return sessionToken;
    }
    
    return null;
  } catch (error) {
    logger.error('Failed to process session token', 'TOKEN', error);
    return null;
  }
}

/**
 * Test if a Google access token is valid by making a simple API call
 */
export async function testGoogleToken(token: string): Promise<boolean> {
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
    logger.error('Token test failed', 'TOKEN', error);
    return false;
  }
} 