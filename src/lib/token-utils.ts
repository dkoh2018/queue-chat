import { logger } from '@/utils';

/**
 * Get Google access token from frontend session (for endpoints that receive it)
 * This is the WORKING method we proved during debugging
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