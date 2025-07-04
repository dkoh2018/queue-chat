import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { calendarService } from '@/services/api/calendar.service';
import { logger } from '@/utils';

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get the user's session to access the Google access token
    const { searchParams } = new URL(request.url);
    const timeMin = searchParams.get('timeMin');
    const timeMax = searchParams.get('timeMax');
    const maxResults = parseInt(searchParams.get('maxResults') || '50');

    // Get access token from Supabase session
    // Note: This requires the user to have signed in with Google OAuth with calendar scopes
    const accessToken = await getGoogleAccessToken(user.id);
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Calendar access not available. Please sign in again to grant calendar permissions.' 
      }, { status: 403 });
    }

    // Fetch calendar events
    const events = await calendarService.getEvents(
      accessToken,
      timeMin || undefined,
      timeMax || undefined,
      maxResults
    );

    logger.info('Calendar events fetched successfully', 'CALENDAR', {
      userId: user.id,
      eventCount: events.length,
      timeRange: { timeMin, timeMax }
    });

    return NextResponse.json({
      events,
      count: events.length,
      timeRange: { timeMin, timeMax }
    });

  } catch (error) {
    logger.error('Failed to fetch calendar events', 'CALENDAR', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json({ 
          error: 'Calendar access denied. Please sign in again to grant calendar permissions.' 
        }, { status: 403 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to fetch calendar events' 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get calendar context for AI
    const accessToken = await getGoogleAccessToken(user.id);
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Calendar access not available. Please sign in again to grant calendar permissions.' 
      }, { status: 403 });
    }

    // Get comprehensive calendar context
    const calendarContext = await calendarService.getCalendarContext(accessToken);

    logger.info('Calendar context fetched for AI', 'CALENDAR', {
      userId: user.id,
      todayEvents: calendarContext.todayEvents.length,
      tomorrowEvents: calendarContext.tomorrowEvents.length,
      totalEvents: calendarContext.totalEvents
    });

    return NextResponse.json({
      context: calendarContext,
      formatted: calendarService.formatCalendarContextForAI(calendarContext)
    });

  } catch (error) {
    logger.error('Failed to get calendar context', 'CALENDAR', error);
    
    if (error instanceof Error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        return NextResponse.json({ 
          error: 'Calendar access denied. Please sign in again to grant calendar permissions.' 
        }, { status: 403 });
      }
    }

    return NextResponse.json({ 
      error: 'Failed to get calendar context' 
    }, { status: 500 });
  }
}

/**
 * Get Google access token for the user
 * This is a placeholder - you'll need to implement this based on how Supabase stores the tokens
 */
async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    // TODO: Implement token retrieval from Supabase
    // This might involve:
    // 1. Getting the user's session from Supabase
    // 2. Extracting the provider_token (Google access token)
    // 3. Checking if the token is still valid
    // 4. Refreshing the token if needed
    
    // For now, return null to indicate calendar access is not available
    // You'll need to implement this based on your Supabase setup
    
    logger.warn('Google access token retrieval not implemented', 'CALENDAR', { userId });
    return null;
    
  } catch (error) {
    logger.error('Failed to get Google access token', 'CALENDAR', error);
    return null;
  }
}