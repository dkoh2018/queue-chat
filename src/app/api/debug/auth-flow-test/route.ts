import { NextRequest, NextResponse } from 'next/server';

interface TestResponse {
  timestamp: string;
  tests: {
    frontend_session: unknown;
    backend_auth: unknown;
    provider_token: unknown;
  };
}

export async function POST(request: NextRequest) {
  try {
    const { testType = 'full-auth-check' } = await request.json();

    if (testType === 'full-auth-check') {
      // This endpoint doesn't require backend auth - it's for testing frontend session
      const response: TestResponse = {
        timestamp: new Date().toISOString(),
        tests: {
          frontend_session: null,
          backend_auth: null,
          provider_token: null
        }
      };

      // Test 1: Check what we can access from frontend (this is a public endpoint)
      try {
        // We can't directly access frontend session from backend, so we'll check headers
        const authHeader = request.headers.get('authorization');
        
        response.tests.backend_auth = {
          hasAuthHeader: !!authHeader,
          headerFormat: authHeader ? (authHeader.startsWith('Bearer ') ? 'valid' : 'invalid') : 'none',
          tokenLength: authHeader ? authHeader.replace('Bearer ', '').length : 0
        };
      } catch (error) {
        response.tests.backend_auth = {
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }

      return NextResponse.json({
        success: true,
        message: 'Auth flow diagnostic complete',
        ...response
      });
    }

    if (testType === 'frontend-session-info') {
      // This should be called from frontend with session data
      const { sessionData } = await request.json();
      
      return NextResponse.json({
        success: true,
        message: 'Frontend session analyzed',
        sessionAnalysis: {
          hasSession: !!sessionData,
          hasAccessToken: !!sessionData?.access_token,
          hasProviderToken: !!sessionData?.provider_token,
          hasRefreshToken: !!sessionData?.refresh_token,
          accessTokenLength: sessionData?.access_token?.length || 0,
          providerTokenLength: sessionData?.provider_token?.length || 0,
          refreshTokenLength: sessionData?.refresh_token?.length || 0,
          user: sessionData?.user ? {
            id: sessionData.user.id,
            email: sessionData.user.email,
            provider: sessionData.user.app_metadata?.provider
          } : null
        }
      });
    }

    return NextResponse.json({ error: 'Invalid test type' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 