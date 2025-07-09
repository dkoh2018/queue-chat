import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 API Debug - Headers received:', {
      authorization: request.headers.get('authorization')?.substring(0, 30) + '...',
      hasAuth: !!request.headers.get('authorization')
    });
    
    const user = await getAuthenticatedUser(request);
    console.log('🔍 API Debug - User from auth:', { hasUser: !!user, userId: user?.id });

    if (!user) {
      console.log('❌ No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: preferences, error } = await supabaseAdmin
      .from('user_preferences')
      .select('custom_system_instructions')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error fetching user preferences:', error);
      return NextResponse.json({ error: 'Failed to fetch preferences' }, { status: 500 });
    }

    return NextResponse.json({
      customSystemInstructions: preferences?.custom_system_instructions || ''
    });
  } catch (error) {
    console.error('Error in GET /api/user-preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 POST API Debug - Headers received:', {
      authorization: request.headers.get('authorization')?.substring(0, 30) + '...',
      hasAuth: !!request.headers.get('authorization')
    });
    
    const user = await getAuthenticatedUser(request);
    console.log('🔍 POST API Debug - User from auth:', { hasUser: !!user, userId: user?.id });

    if (!user) {
      console.log('❌ POST: No user found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { customSystemInstructions } = await request.json();

    // Use upsert to insert or update
    const { error } = await supabaseAdmin
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        custom_system_instructions: customSystemInstructions || null,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error saving user preferences:', error);
      return NextResponse.json({ error: 'Failed to save preferences' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in POST /api/user-preferences:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
