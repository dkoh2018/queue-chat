import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { supabaseAdmin } from '@/lib/supabase-server';
import { SYSTEM_PROMPTS } from '@/lib/prompts';
import { BASE_SYSTEM_PROMPT } from '@/lib/base-prompts';
import { calendarService } from '@/services/api/calendar.service';
import { logger, UI_CONSTANTS } from '@/utils';
import { getIntegration } from '@/integrations';
import { IntegrationType } from '@/types';

// Define message type for API
interface APIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    // Require authentication for chat
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { messages, conversationId, originalInput, optimizedInput, isDiagramRequest, isCalendarRequest, activeIntegrations } = await request.json();
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

    // OPTIMIZATION: Apply conversation history limit to reduce token costs and prevent context window issues
    // Use the same limit as integrations for consistency
    const limitedMessages = messages.slice(-UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT);
    
    // Use optimized messages for OpenAI API call (with optimized input and history limit)
    let messagesForAPI = optimizedInput ?
      [...limitedMessages.slice(0, -1), { role: 'user', content: optimizedInput }] :
      limitedMessages;

    // SAFEGUARD: Remove any existing system prompts to prevent duplicates
    messagesForAPI = messagesForAPI.filter((msg: APIMessage) => msg.role !== 'system');
    
    // ALWAYS apply base system prompt first - GUARANTEED SINGLE APPLICATION
    messagesForAPI = [
      { role: 'system', content: BASE_SYSTEM_PROMPT },
      ...messagesForAPI
    ];
    
    logger.info('Base system prompt applied', 'CHAT', {
      userId: user.id,
      messageCount: messagesForAPI.length,
      hasBasePrompt: messagesForAPI[0]?.role === 'system' && messagesForAPI[0]?.content === BASE_SYSTEM_PROMPT,
      conversationHistoryLength: limitedMessages.length
    });

    // NEW INTEGRATION SYSTEM: Add integration-specific prompts on top of base prompt
    if (activeIntegrations && Array.isArray(activeIntegrations) && activeIntegrations.length > 0) {
      // Process each active integration
      for (const integrationType of activeIntegrations) {
        const integration = getIntegration(integrationType as IntegrationType);
        if (integration) {
          // Add the integration's system prompt AFTER the base prompt
          messagesForAPI = [
            messagesForAPI[0], // Keep base system prompt
            { role: 'system', content: integration.systemPrompt },
            ...messagesForAPI.slice(1) // Keep user messages
          ];
          
          logger.info('Integration system prompt applied', 'INTEGRATION', {
            userId: user.id,
            integration: integrationType
          });
        } else {
          logger.error('Integration not found', 'INTEGRATION', {
            userId: user.id,
            integration: integrationType
          });
        }
      }
    } else if (isDiagramRequest) {
      // FALLBACK: Support legacy isDiagramRequest for backward compatibility
      const mermaidIntegration = getIntegration('mermaid' as IntegrationType);
      if (mermaidIntegration) {
        messagesForAPI = [
          messagesForAPI[0], // Keep base system prompt
          { role: 'system', content: mermaidIntegration.systemPrompt },
          ...messagesForAPI.slice(1) // Keep user messages
        ];
        
        logger.info('Legacy Mermaid integration applied', 'INTEGRATION', {
          userId: user.id,
          integration: 'mermaid'
        });
      }
    }

    // Calendar integration handling (keeping existing logic for now)
    if (isCalendarRequest) {
      try {
        // Get user's Google access token (placeholder implementation)
        const accessToken = await getGoogleAccessToken(user.id);
        
        if (accessToken) {
          // Get calendar context
          const calendarContext = await calendarService.getCalendarContext(accessToken);
          const formattedCalendarData = calendarService.formatCalendarContextForAI(calendarContext);
          
          // Replace placeholder in calendar prompt with actual data
          const calendarPromptWithData = SYSTEM_PROMPTS.CALENDAR_EXPERT.replace(
            '{calendarData}',
            formattedCalendarData
          );
          
          messagesForAPI = [
            messagesForAPI[0], // Keep base system prompt
            { role: 'system', content: calendarPromptWithData },
            ...messagesForAPI.slice(1) // Keep user messages
          ];
          
          logger.info('Calendar context added to chat', 'CALENDAR', {
            userId: user.id,
            eventCount: calendarContext.totalEvents
          });
        } else {
          // No calendar access - add prompt explaining this
          const noAccessPrompt = `The user is asking about calendar/scheduling but you don't have access to their calendar data.
          Politely explain that they need to sign in again to grant calendar permissions, and offer general scheduling advice instead.`;
          
          messagesForAPI = [
            messagesForAPI[0], // Keep base system prompt
            { role: 'system', content: noAccessPrompt },
            ...messagesForAPI.slice(1) // Keep user messages
          ];
          
          logger.warn('Calendar request without access token', 'CALENDAR', { userId: user.id });
        }
      } catch (error) {
        logger.error('Failed to get calendar context for chat', 'CALENDAR', error);
        
        // Fallback - continue without calendar data
        const errorPrompt = `The user is asking about calendar/scheduling but there was an error accessing their calendar.
        Apologize for the technical issue and offer general scheduling advice instead.`;
        
        messagesForAPI = [
          messagesForAPI[0], // Keep base system prompt
          { role: 'system', content: errorPrompt },
          ...messagesForAPI.slice(1) // Keep user messages
        ];
      }
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
      isDiagramRequest: !!isDiagramRequest,
      isCalendarRequest: !!isCalendarRequest,
      usedNewIntegrationSystem: !!(isDiagramRequest && getIntegration('mermaid' as IntegrationType)),
      messagesInContext: messagesForAPI.length,
      systemPrompts: messagesForAPI.filter((m: APIMessage) => m.role === 'system').length,
      userMessages: messagesForAPI.filter((m: APIMessage) => m.role === 'user').length,
      assistantMessages: messagesForAPI.filter((m: APIMessage) => m.role === 'assistant').length,
      historyLimitApplied: messages.length > UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT,
      basePromptConfirmed: messagesForAPI[0]?.role === 'system' && messagesForAPI[0]?.content.includes('helpful, knowledgeable, and friendly')
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

/**
 * Get Google access token for the user
 * This is a placeholder implementation - needs to be completed based on Supabase setup
 */
async function getGoogleAccessToken(userId: string): Promise<string | null> {
  try {
    // Get user from Supabase admin to access provider tokens
    const { data: { user }, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (error || !user) {
      logger.error('Failed to get user for token retrieval', 'CALENDAR', error);
      return null;
    }

    // Check if user has Google identity with provider token
    const googleIdentity = user.identities?.find((identity: { provider: string; identity_data?: { provider_token?: string } }) => identity.provider === 'google');
    
    if (!googleIdentity) {
      logger.warn('User has no Google identity', 'CALENDAR', { userId });
      return null;
    }

    // Extract the access token from the identity
    const accessToken = googleIdentity.identity_data?.provider_token;
    
    if (!accessToken) {
      logger.warn('No Google access token found in identity', 'CALENDAR', { userId });
      return null;
    }

    // TODO: Add token expiration check and refresh logic here if needed
    // For now, we'll use the token as-is since Google tokens are typically valid for 1 hour
    // and the calendar service will handle API errors gracefully
    
    logger.info('Successfully retrieved Google access token', 'CALENDAR', { userId });
    return accessToken;
    
  } catch (error) {
    logger.error('Failed to get Google access token', 'CALENDAR', error);
    return null;
  }
}