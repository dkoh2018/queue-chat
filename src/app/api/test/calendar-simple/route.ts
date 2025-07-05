import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { calendarService } from '@/services/api/calendar.service';
import { logger } from '@/utils';

export async function POST(request: NextRequest) {
  try {
    const { userId, query, providerToken } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    logger.info('Simple calendar test', 'TEST', { userId, query });

    // Step 1: Get user data
    const { data: { user }, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (userError || !user) {
      return NextResponse.json({
        step: 1,
        error: 'Failed to get user',
        details: userError?.message
      });
    }

    // Step 2: Get provider token - prioritize frontend token
    let accessToken = providerToken;
    
    if (!accessToken) {
      // Fallback: Try to get from user identities
      const googleIdentity = user.identities?.find((identity: any) => identity.provider === 'google');
      accessToken = googleIdentity?.identity_data?.provider_token;
      
      if (!accessToken) {
        return NextResponse.json({
          step: 2,
          error: 'No Google access token found. The token might be stored in the browser session instead.',
          hasGoogleIdentity: !!googleIdentity,
          hasProviderTokenFromFrontend: !!providerToken,
          suggestion: 'Make sure you are signed in with Google and have granted calendar permissions'
        });
      }
    }

    logger.info('Using access token', 'TEST', {
      tokenSource: providerToken ? 'frontend' : 'identity_data',
      tokenLength: accessToken.length
    });

    // Step 3: Test calendar API call - get upcoming events from current time
    try {
      // Get current time in Chicago timezone
      const now = new Date();
      const chicagoTime = new Date(now.toLocaleString("en-US", {timeZone: "America/Chicago"}));
      
      // Get events from now until 6 months from now
      const sixMonthsFromNow = new Date(chicagoTime);
      sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
      
      logger.info('Fetching upcoming events', 'TEST', {
        currentTime: chicagoTime.toISOString(),
        endTime: sixMonthsFromNow.toISOString(),
        timezone: 'America/Chicago'
      });
      
      const events = await calendarService.getEvents(
        accessToken,
        chicagoTime.toISOString(), // Start from current time
        sixMonthsFromNow.toISOString(), // End 6 months from now
        50 // Max 50 events
      );
      
      return NextResponse.json({
        success: true,
        query: query,
        currentTime: chicagoTime.toISOString(),
        timezone: 'America/Chicago',
        calendarData: {
          eventCount: events.length,
          events: events.slice(0, 10).map(event => ({
            summary: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end?.dateTime || event.end?.date,
            location: event.location
          })),
          allEvents: events.map(event => ({
            summary: event.summary,
            start: event.start.dateTime || event.start.date,
            end: event.end?.dateTime || event.end?.date,
            location: event.location
          })),
          message: events.length > 0
            ? `✅ Successfully retrieved ${events.length} upcoming calendar events from ${chicagoTime.toLocaleString('en-US', { timeZone: 'America/Chicago' })}!`
            : '📅 Calendar connected but no upcoming events found'
        }
      });
    } catch (calendarError) {
      return NextResponse.json({
        step: 3,
        error: 'Calendar API call failed',
        details: calendarError instanceof Error ? calendarError.message : 'Unknown calendar error',
        suggestion: 'Check if calendar permissions are granted and token is valid'
      });
    }

  } catch (error) {
    logger.error('Simple calendar test failed', 'TEST', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Add GET method for testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Calendar test API is working!',
    timestamp: new Date().toISOString()
  });
}