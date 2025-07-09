import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { logger } from '@/utils';

export async function POST(request: Request) {
  try {
    const { id, email, name, avatar_url } = await request.json();

    if (!id || !email) {
      logger.warn('Missing required user data', 'AUTH', { id: !!id, email: !!email });
      return NextResponse.json({ error: 'User ID and email are required' }, { status: 400 });
    }

    logger.info('Creating/updating user in Supabase', 'AUTH', { id, email, hasName: !!name });

    // Create or update user in the users table (adapting to your existing logic)
    const { data: user, error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert({
        id,
        email,
        name: name || null,
        avatar_url: avatar_url || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'id'
      })
      .select()
      .single();

    if (upsertError) {
      logger.error('Failed to create/update user', 'AUTH', upsertError);
      return NextResponse.json({
        error: 'Failed to create/update user',
        details: upsertError.message
      }, { status: 500 });
    }

    logger.info('User created/updated successfully', 'AUTH', { userId: user.id });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    logger.error('Failed to process user auth', 'AUTH', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'UnknownError'
    });

    return NextResponse.json({
      error: 'Failed to process user auth'
    }, { status: 500 });
  }
}