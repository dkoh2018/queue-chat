import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 404 });
  }

  try {
    const { message, data } = await request.json();
    
    // Log to server terminal with timestamp
    const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
    console.log(`🔍 ${timestamp} [CLIENT] ${message}`);
    
    if (data) {
      // Format data nicely for terminal
      if (typeof data === 'object') {
        console.log('   Data:', JSON.stringify(data, null, 2));
      } else {
        console.log('   Data:', data);
      }
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Debug log error:', error);
    return NextResponse.json({ error: 'Failed to log' }, { status: 500 });
  }
}