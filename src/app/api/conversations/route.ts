import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthenticatedUser, createUnauthorizedResponse } from '@/lib/auth';
import { logger } from '@/utils';

export async function GET(request: NextRequest) {
  try {
    // Try to authenticate user (optional for this endpoint)
    const user = await getAuthenticatedUser(request);
    
    if (user) {
      // Authenticated user - fetch conversations for this user only
      logger.info('Fetching conversations for authenticated user', 'DATABASE', { userId: user.id });
      
      // OPTIMIZATION: Fetch conversations first, then get limited messages separately
      // This prevents loading thousands of messages when user just wants conversation list
      const { data: conversations, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        throw new Error(`Supabase error: ${error.message}`);
      }

      // Fetch only the last 3 messages per conversation for preview
      const conversationsWithMessages = await Promise.all(
        (conversations || []).map(async (conv) => {
          const { data: messages } = await supabaseAdmin
            .from('messages')
            .select('id, role, content, created_at')
            .eq('conversation_id', conv.id)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(3);

          return {
            ...conv,
            messages: (messages || []).reverse() // Reverse to get chronological order for display
          };
        })
      );

      // Transform database format to frontend format and sort messages
      // NOTE: Only showing last 3 messages per conversation for performance
      // Full conversation history is loaded when user clicks on a specific conversation
      const conversationsWithSortedMessages = conversationsWithMessages?.map(conv => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.created_at,
        updatedAt: conv.updated_at,
        messages: conv.messages?.sort((a: { created_at: string }, b: { created_at: string }) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ).map((msg: { id: string; role: string; content: string; created_at: string }) => ({
          id: msg.id,
          role: msg.role as 'USER' | 'ASSISTANT', // Ensure proper typing - keep database format
          content: msg.content,
          createdAt: msg.created_at
        })) || []
      })) || [];

      // **DEBUG**: Log conversation ordering from database
      logger.api('Conversations ordered by updatedAt DESC', {
        count: conversationsWithSortedMessages.length,
        timestamp: new Date().toISOString(),
        conversations: conversationsWithSortedMessages.slice(0, 5).map(c => ({
          id: c.id.slice(0, 8),
          title: c.title?.slice(0, 30) || 'Untitled',
          updatedAt: c.updatedAt,
          messageCount: c.messages?.length || 0
        }))
      });

      logger.info('User conversations fetched successfully', 'DATABASE', {
        userId: user.id,
        count: conversationsWithSortedMessages.length
      });
      
      const response = NextResponse.json(conversationsWithSortedMessages);
      response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30');
      response.headers.set('ETag', `"conversations-${user.id}-${conversationsWithSortedMessages.length}-${Date.now()}"`);
      
      return response;
    } else {
      // Anonymous user - return unauthorized
      logger.info('Unauthorized access to conversations', 'DATABASE');
      return createUnauthorizedResponse();
    }
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

export async function DELETE(request: NextRequest) {
  try {
    // Authenticate user - required for deletion
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return createUnauthorizedResponse();
    }

    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('id');

    if (!conversationId) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Find the conversation and verify ownership
    const { data: conversation, error: findError } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .single();

    if (findError || !conversation) {
      return NextResponse.json({
        error: 'Conversation not found'
      }, { status: 404 });
    }

    // Delete the conversation (messages will be deleted due to cascade)
    const { error: deleteError } = await supabaseAdmin
      .from('conversations')
      .delete()
      .eq('id', conversationId);

    if (deleteError) {
      throw new Error(`Supabase delete error: ${deleteError.message}`);
    }

    logger.info('User conversation deleted successfully', 'DATABASE', {
      userId: user.id,
      conversationId
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Failed to delete user conversation', 'DATABASE', {
      message: error instanceof Error ? error.message : 'Unknown error',
      userId: 'unknown'
    });
    return NextResponse.json({
      error: 'Failed to delete conversation'
    }, { status: 500 });
  }
}