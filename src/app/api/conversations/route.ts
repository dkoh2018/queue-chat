import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { logger } from '@/utils';

export async function GET() {
  try {
    logger.db('Starting conversation fetch');
    
    const conversations = await prisma.conversation.findMany({
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });

    logger.db('Conversations fetched successfully', { count: conversations.length });
    
    const response = NextResponse.json(conversations);
    
    // Add caching headers to reduce database load
    response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
    response.headers.set('ETag', `"conversations-${conversations.length}-${Date.now()}"`);
    
    return response;
  } catch (error) {
    logger.error('Failed to fetch conversations', 'DATABASE', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({ 
      error: 'Failed to fetch conversations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    await prisma.conversation.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete conversation', 'DATABASE', error);
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500 });
  }
}