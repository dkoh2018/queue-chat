import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  const { messages, conversationId, originalInput, optimizedInput } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  try {
    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await prisma.conversation.findUnique({
        where: { id: conversationId }
      });
    }

    if (!conversation) {
      // Create new conversation with title from original user input
      const title = originalInput?.slice(0, 50) + '...' || 'New conversation';
      
      conversation = await prisma.conversation.create({
        data: { title }
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
    const messagesForAPI = optimizedInput ? 
      [...messages.slice(0, -1), { role: 'user', content: optimizedInput }] : 
      messages;

    // Get OpenAI response
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'gpt-4.1-mini', messages: messagesForAPI }),
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

    // Log chat completion
    console.log('💬 CHAT COMPLETED:', {
      conversationId: conversation.id,
      responseLength: content.length,
      wasOptimized: !!optimizedInput
    });

    return NextResponse.json({
      content,
      conversationId: conversation.id
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    console.error('Chat API error:', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}