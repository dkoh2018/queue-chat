import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { SYSTEM_PROMPTS } from '@/lib/prompts';
import { logger } from '@/utils';

export async function POST(request: NextRequest) {
  try {
    // Require authentication for chat
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { messages, conversationId, originalInput, optimizedInput, isDiagramRequest } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    let conversation = null;

    // Authenticated user - handle database operations
    logger.info('Processing chat for authenticated user', 'CHAT', { userId: user.id });

    // Get or create conversation
    if (conversationId) {
      // Find the conversation and verify ownership
      conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          userId: user.id
        }
      });

      if (!conversation) {
        return NextResponse.json({
          error: 'Conversation not found'
        }, { status: 404 });
      }
    }

    if (!conversation) {
      // Create new conversation with title from original user input
      const title = originalInput?.slice(0, 50) + '...' || 'New conversation';
      
      conversation = await prisma.conversation.create({
        data: {
          title,
          userId: user.id
        }
      });

      logger.info('Created new conversation for authenticated user', 'CHAT', {
        userId: user.id,
        conversationId: conversation.id
      });
    }

      // Save ORIGINAL user message to database (not optimized)
      if (originalInput) {
        await prisma.message.create({
          data: {
            role: 'USER',
            content: originalInput,
            conversationId: conversation.id
          }
        });
      } else {
        // Fallback to previous behavior if no originalInput provided
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === 'user') {
          await prisma.message.create({
            data: {
              role: 'USER',
              content: lastUserMessage.content,
              conversationId: conversation.id
            }
          });
        }
      }

    // Use optimized messages for OpenAI API call (with optimized input)
    let messagesForAPI = optimizedInput ? 
      [...messages.slice(0, -1), { role: 'user', content: optimizedInput }] : 
      messages;

    // If this is a diagram request, prepend the Mermaid expert system prompt
    if (isDiagramRequest) {
      messagesForAPI = [
        { role: 'system', content: SYSTEM_PROMPTS.MERMAID_EXPERT },
        ...messagesForAPI
      ];
    }

    // Get OpenAI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: messagesForAPI }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Save assistant message to database
    await prisma.message.create({
      data: {
        role: 'ASSISTANT',
        content,
        conversationId: conversation.id
      }
    });

    // Manually update the conversation's updatedAt timestamp
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: { updatedAt: new Date() },
    });

    // Log chat completion for authenticated user
    logger.info('Chat completed for authenticated user', 'CHAT', {
      userId: user.id,
      conversationId: conversation.id,
      responseLength: content.length,
      wasOptimized: !!optimizedInput,
      isDiagramRequest: !!isDiagramRequest
    });

    return NextResponse.json({
      content,
      conversationId: conversation.id
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    logger.error('Chat API error', 'CHAT', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}