import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, providerToken } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    console.log('🧪 TESTING SESSION TOKEN APPROACH');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`👤 User: ${userId}`);
    console.log(`🔑 Provider token received: ${!!providerToken}`);
    
    if (providerToken) {
      console.log(`📏 Token length: ${providerToken.length}`);
      console.log(`🔤 Token preview: ${providerToken.substring(0, 20)}...`);
      
      // Test Google Calendar API with the session token
      try {
        const calendarResponse = await fetch(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=3',
          {
            headers: {
              'Authorization': `Bearer ${providerToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (calendarResponse.ok) {
          const data = await calendarResponse.json();
          console.log('✅ SESSION TOKEN WORKS!');
          console.log(`📅 Retrieved ${data.items?.length || 0} events`);
          
          return NextResponse.json({
            success: true,
            message: 'Session token works perfectly!',
            tokenSource: 'frontend_session',
            calendarAccess: true,
            eventCount: data.items?.length || 0,
            events: data.items?.slice(0, 3).map((event: { summary?: string; start?: { dateTime?: string; date?: string } }) => ({
              summary: event.summary,
              start: event.start?.dateTime || event.start?.date
            })) || []
          });
        } else {
          const errorText = await calendarResponse.text();
          console.log('❌ SESSION TOKEN FAILED');
          console.log(`📊 Status: ${calendarResponse.status}`);
          console.log(`💬 Error: ${errorText.substring(0, 100)}...`);
          
          return NextResponse.json({
            success: false,
            message: 'Session token failed',
            status: calendarResponse.status,
            error: errorText.substring(0, 100)
          });
        }
      } catch (error) {
        console.log(`❌ API call failed: ${error}`);
        return NextResponse.json({
          success: false,
          message: 'API call failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    } else {
      console.log('❌ No provider token provided');
      return NextResponse.json({
        success: false,
        message: 'No provider token provided',
        suggestion: 'Make sure to get session.provider_token from frontend'
      });
    }

  } catch (error) {
    console.error('🚨 TEST ERROR:', error);
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 