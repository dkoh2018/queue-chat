import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { calendarService } from '@/services/api/calendar.service';
import { getGoogleAccessToken } from '@/lib/token-utils';
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
    const providerToken = searchParams.get('providerToken'); // Accept token from frontend

    // Get access token using the working method - prioritize frontend token
    let accessToken = providerToken;
    
    if (!accessToken) {
      // Fallback to backend token retrieval
      accessToken = await getGoogleAccessToken(user.id);
    }
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Calendar access not available. Please sign in again to grant calendar permissions.',
        suggestion: 'Make sure to pass providerToken from frontend session or refresh your login'
      }, { status: 403 });
    }

    logger.info('Using calendar access token', 'CALENDAR', {
      userId: user.id,
      tokenSource: providerToken ? 'frontend' : 'backend',
      tokenLength: accessToken.length
    });

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

    // Get provider token from request body (like the working test endpoint)
    const { providerToken } = await request.json();

    // Get access token using the working method - prioritize frontend token
    let accessToken = providerToken;
    
    if (!accessToken) {
      // Fallback to backend token retrieval
      accessToken = await getGoogleAccessToken(user.id);
    }
    
    if (!accessToken) {
      return NextResponse.json({ 
        error: 'Calendar access not available. Please sign in again to grant calendar permissions.',
        suggestion: 'Make sure to pass providerToken from frontend session or refresh your login'
      }, { status: 403 });
    }

    logger.info('Using calendar access token for context', 'CALENDAR', {
      userId: user.id,
      tokenSource: providerToken ? 'frontend' : 'backend',
      tokenLength: accessToken.length
    });

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

// Token retrieval is now handled by the unified token-utils module