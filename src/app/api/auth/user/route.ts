import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/utils';

export async function POST(request: Request) {
  try {
    const { id, email, name, avatar_url } = await request.json();

    if (!id || !email) {
      return NextResponse.json({ error: 'User ID and email are required' }, { status: 400 });
    }

    logger.info('Creating/updating user', 'AUTH', { id, email });

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        name: name || null,
        avatarUrl: avatar_url || null,
      },
      create: {
        id,
        email,
        name: name || null,
        avatarUrl: avatar_url || null,
      },
    });

    logger.info('User created/updated successfully', 'AUTH', { userId: user.id });

    return NextResponse.json({ success: true, user });
  } catch (error) {
    logger.error('Failed to create/update user', 'AUTH', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({
      error: 'Failed to create/update user',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}