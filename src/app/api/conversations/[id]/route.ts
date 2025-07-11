import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth';
import { logger } from '@/utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;
  
  try {
    // Authenticate user - required for fetching conversation details
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    logger.info('Fetching full conversation history', 'DATABASE', { 
      userId: user.id, 
      conversationId: conversationId.slice(0, 8) 
    });

    // Fetch the conversation and verify ownership
    const { data: conversation, error: convError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({
        error: 'Conversation not found'
      }, { status: 404 });
    }

    // Fetch ALL messages for this conversation
    const { data: messages, error: messagesError } = await supabaseAdmin
      .from('messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true }); // Chronological order

    if (messagesError) {
      throw new Error(`Failed to fetch messages: ${messagesError.message}`);
    }

    // Transform to frontend format
    const conversationWithMessages = {
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages: (messages || []).map(msg => ({
        id: msg.id,
        role: msg.role as 'USER' | 'ASSISTANT',
        content: msg.content,
        createdAt: msg.created_at
      }))
    };

    logger.info('Full conversation history fetched successfully', 'DATABASE', {
      userId: user.id,
      conversationId: conversationId.slice(0, 8),
      messageCount: messages?.length || 0
    });

    const response = NextResponse.json(conversationWithMessages);
    response.headers.set('Cache-Control', 'private, max-age=30, stale-while-revalidate=60');
    
    return response;
  } catch (error) {
    logger.error('Failed to fetch conversation history', 'DATABASE', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: 'unknown',
      conversationId: conversationId || 'unknown'
    });
    return NextResponse.json({
      error: 'Failed to fetch conversation history',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 