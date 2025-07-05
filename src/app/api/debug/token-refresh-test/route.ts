import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { testType = 'session-info' } = await request.json();

    if (testType === 'session-info') {
      // Test what session info is available
      const authHeader = request.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      return NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        },
        tokenInfo: {
          hasToken: !!token,
          tokenLength: token?.length || 0,
          tokenPrefix: token?.substring(0, 10) || 'none'
        },
        timestamp: new Date().toISOString()
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