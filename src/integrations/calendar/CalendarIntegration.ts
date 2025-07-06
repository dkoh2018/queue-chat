import { BaseIntegration } from '../base';
import { IntegrationConfig, IntegrationContext, IntegrationProcessResult } from '../types';
import { CalendarIcon } from '@/components/icons';
import { calendarPipeline } from './pipeline';

export class CalendarIntegration extends BaseIntegration {
  readonly config: IntegrationConfig = {
    id: 'calendar',
    name: 'Calendar',
    description: 'Smart calendar integration with context-aware scheduling',
    icon: CalendarIcon,
    systemPrompt: '', // No system prompt - Stage 3 handles all formatting
    enabled: true,
  };

  async processMessage(
    message: string,
    context: IntegrationContext
  ): Promise<IntegrationProcessResult> {
    try {
      // Check if we have both tokens in context
      const providerToken = context.providerToken as string;
      const sessionToken = context.sessionToken as string;
      
      if (!providerToken || !sessionToken) {
              return {
        systemPrompt: '', // No system prompt - Stage 3 handles all formatting
        modifiedInput: message,
        context: {
          integrationId: this.config.id,
          error: 'Calendar integration requires both Google OAuth token and session token',
        },
        requiresSpecialHandling: false,
      };
      }

      // Execute the 4-stage calendar pipeline with both tokens
      const calendarResponse = await calendarPipeline.execute(message, providerToken, sessionToken);

      // Return the Stage 3 response directly - no further processing needed!
      return {
        systemPrompt: '', // No system prompt - Stage 3 handles all formatting
        modifiedInput: calendarResponse, // Direct Stage 3 response
        context: {
          integrationId: this.config.id,
          calendarProcessed: true,
          finalResponse: true, // Indicates this is the final response
        },
        requiresSpecialHandling: true, // Tell chat API to use this as final response
      };
    } catch (error) {
      return {
        systemPrompt: '', // No system prompt - Stage 3 handles all formatting
        modifiedInput: message,
        context: {
          integrationId: this.config.id,
          error: error instanceof Error ? error.message : 'Calendar integration failed',
        },
        requiresSpecialHandling: false,
      };
    }
  }

  // Override canHandle to detect calendar-related keywords
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  canHandle(message: string, _context: IntegrationContext): boolean {
    const calendarKeywords = [
      'calendar', 'schedule', 'meeting', 'appointment', 'event',
      'today', 'tomorrow', 'next week', 'this week', 'when',
      'what time', 'available', 'busy', 'free', 'conflict'
    ];
    
    const lowerMessage = message.toLowerCase();
    return calendarKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Override prepare for calendar-specific setup
  async prepare(context: IntegrationContext): Promise<void> {
    // Could add token validation logic here if needed
    const providerToken = context.providerToken as string;
    const sessionToken = context.sessionToken as string;
    if (!providerToken || !sessionToken) {
      throw new Error('Calendar integration requires both Google OAuth token and session token');
    }
  }
}
