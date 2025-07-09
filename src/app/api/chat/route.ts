import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/auth';
import { APIErrorHandler } from '@/lib/error-handler';
import type { ChatRequest, ChatResponse } from '@/types/chat.types';
import type { Conversation } from '@/types/database';

import { BASE_SYSTEM_PROMPT } from '@/lib/prompts/base';
import { logger, UI_CONSTANTS } from '@/utils';
import { getIntegration } from '@/integrations';
import { IntegrationType } from '@/types';



export async function POST(request: NextRequest) {
  try {
    // Require authentication for chat
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return APIErrorHandler.unauthorized();
    }

    const { messages, conversationId, originalInput, optimizedInput, isDiagramRequest, isCalendarRequest, activeIntegrations, providerToken }: ChatRequest = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return APIErrorHandler.handle(new Error('OpenAI API key not configured'));
    }

    let conversation: Conversation | null = null;

    // Authenticated user - handle database operations
    logger.info('Processing chat for authenticated user', 'CHAT', { userId: user.id });

    // Get or create conversation
    if (conversationId) {
      // Find the conversation and verify ownership (adapting your existing logic)
      const { data: foundConversation, error } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();

      if (error || !foundConversation) {
        return APIErrorHandler.notFound('Conversation not found');
      }

      conversation = foundConversation;
    }

    if (!conversation) {
      // Create new conversation with title from original user input (adapting your existing logic)
      const title = originalInput?.slice(0, 50) + '...' || 'New conversation';

      // Generate a unique ID for the conversation (like Prisma's cuid())
      const conversationId = crypto.randomUUID();

      const { data: newConversation, error: createError } = await supabaseAdmin
        .from('conversations')
        .insert({
          id: conversationId,
          title,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError || !newConversation) {
        return APIErrorHandler.handle(createError, 'conversation creation');
      }

      conversation = newConversation;

      logger.info('Created new conversation for authenticated user', 'CHAT', {
        userId: user.id,
        conversationId: newConversation.id
      });
    }

    // At this point, conversation is guaranteed to exist
    if (!conversation) {
      return APIErrorHandler.handle(new Error('Failed to create or retrieve conversation'));
    }

      // Save ORIGINAL user message to database (not optimized) - adapting your existing logic
      if (originalInput) {
        const { error: userMessageError } = await supabaseAdmin
          .from('messages')
          .insert({
            id: crypto.randomUUID(),
            role: 'USER',
            content: originalInput,
            conversation_id: conversation.id,
            user_id: user.id
          });

        if (userMessageError) {
          logger.error('Failed to save user message', 'CHAT', { error: userMessageError.message });
        }
      } else {
        // Fallback to previous behavior if no originalInput provided
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === 'user') {
          const { error: userMessageError } = await supabaseAdmin
            .from('messages')
            .insert({
              id: crypto.randomUUID(),
              role: 'USER',
              content: lastUserMessage.content,
              conversation_id: conversation.id,
              user_id: user.id
            });

          if (userMessageError) {
            logger.error('Failed to save user message (fallback)', 'CHAT', { error: userMessageError.message });
          }
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
    messagesForAPI = messagesForAPI.filter((msg) => msg.role !== 'system');
    
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

    // Calendar integration handling - NEW: Use the CalendarIntegration with 4-stage pipeline
    if (isCalendarRequest && activeIntegrations?.includes('calendar')) {
      try {
        const calendarIntegration = getIntegration('calendar' as IntegrationType);
        if (calendarIntegration && providerToken) {
          // Get the session access token from the request (same way as test page)
          const authHeader = request.headers.get('authorization');
          const sessionToken = authHeader?.replace('Bearer ', '');
          
          // Process the calendar integration using the new system
          const result = await calendarIntegration.processMessage(
            originalInput || messagesForAPI[messagesForAPI.length - 1].content,
            { 
              userId: user.id,
              conversationId: conversation.id,
              providerToken,  // Google Calendar token
              sessionToken    // Supabase session token for API auth
            }
          );
          
          // Check if this is a final response that doesn't need further processing
          if (result.requiresSpecialHandling && result.context?.finalResponse && result.modifiedInput) {
            // This is the final Stage 3 response - return it directly!
            const finalContent = result.modifiedInput;
            
            // Save assistant message to database - adapting your existing logic
            const { error: assistantMessageError } = await supabaseAdmin
              .from('messages')
              .insert({
                id: crypto.randomUUID(),
                role: 'ASSISTANT',
                content: finalContent,
                conversation_id: conversation.id,
                user_id: user.id
              });

            if (assistantMessageError) {
              logger.error('Failed to save assistant message (special handling)', 'CHAT', { error: assistantMessageError.message });
            }

            // Update conversation timestamp - adapting your existing logic
            await supabaseAdmin
              .from('conversations')
              .update({ updated_at: new Date().toISOString() })
              .eq('id', conversation.id);

            // **DEBUG**: Log conversation timestamp update
            logger.api('Conversation updatedAt timestamp updated', {
              conversationId: conversation.id.slice(0, 8),
              userId: user.id,
              timestamp: new Date().toISOString(),
              newUpdatedAt: new Date().toISOString()
            });

            logger.info('Calendar integration returned final response directly', 'CALENDAR', {
              userId: user.id,
              calendarProcessed: result.context?.calendarProcessed || false,
              finalResponse: true,
              responseLength: finalContent.length
            });

            return NextResponse.json({
              content: finalContent,
              conversationId: conversation.id
            });
          }
          
          // Use the processed result for further processing
          if (result.modifiedInput) {
            // Replace the last user message with the calendar-enhanced version
            messagesForAPI[messagesForAPI.length - 1] = {
              role: 'user',
              content: result.modifiedInput
            };
            
            logger.info('Calendar integration processed successfully', 'CALENDAR', {
              userId: user.id,
              calendarProcessed: result.context?.calendarProcessed || false
            });
          }
        } else {
          logger.warn('Calendar integration not available or no provider token', 'CALENDAR', {
            userId: user.id,
            hasIntegration: !!calendarIntegration,
            hasToken: !!providerToken
          });
        }
      } catch (error) {
        logger.error('Failed to process calendar integration', 'CALENDAR', error);
        
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
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model: 'gpt-4o-mini', messages: messagesForAPI }),
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.text();
      return NextResponse.json({ error }, { status: openaiResponse.status });
    }

    const data = await openaiResponse.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    // Save assistant message to database - adapting your existing logic
    const { error: assistantMessageError } = await supabaseAdmin
      .from('messages')
      .insert({
        id: crypto.randomUUID(),
        role: 'ASSISTANT',
        content,
        conversation_id: conversation.id,
        user_id: user.id
      });

    if (assistantMessageError) {
      logger.error('Failed to save assistant message', 'CHAT', { error: assistantMessageError.message });
    }

    // Manually update the conversation's updatedAt timestamp - adapting your existing logic
    await supabaseAdmin
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversation.id);

    // **DEBUG**: Log conversation timestamp update
    logger.api('Conversation updatedAt timestamp updated', {
      conversationId: conversation.id.slice(0, 8),
      userId: user.id,
      timestamp: new Date().toISOString(),
      newUpdatedAt: new Date().toISOString()
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
      systemPrompts: messagesForAPI.filter((m) => m.role === 'system').length,
      userMessages: messagesForAPI.filter((m) => m.role === 'user').length,
      assistantMessages: messagesForAPI.filter((m) => m.role === 'assistant').length,
      historyLimitApplied: messages.length > UI_CONSTANTS.CONVERSATION_HISTORY_LIMIT,
      basePromptConfirmed: messagesForAPI[0]?.role === 'system' && messagesForAPI[0]?.content.includes('helpful, knowledgeable, and friendly')
    });

    const chatResponse: ChatResponse = {
      content,
      conversationId: conversation.id
    };

    return NextResponse.json(chatResponse);
  } catch (err: unknown) {
    return APIErrorHandler.handle(err, 'chat');
  }
}

