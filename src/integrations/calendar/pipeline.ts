// Calendar 4-Stage Pipeline - Extracted from working test page
import { logger } from '@/utils';

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  status: string;
  htmlLink: string;
  isAllDay: boolean;
  isRecurring: boolean;
  day: string;
}

interface CalendarResponse {
  events: CalendarEvent[];
  summary: string;
  dateRange: {
    start: string;
    end: string;
  };
  totalEvents: number;
  hasMoreEvents: boolean;
}



interface ParameterIntelligenceResult {
  timeMin: string;
  timeMax: string;
  maxResults?: number;
}

interface RawCalendarData {
  items?: Array<{
    id: string;
    summary?: string;
    start?: {
      dateTime?: string;
      date?: string;
    };
    end?: {
      dateTime?: string;
      date?: string;
    };
    location?: string;
    description?: string;
    status?: string;
    htmlLink?: string;
    recurringEventId?: string;
  }>;
}

export class CalendarPipeline {
  private baseUrl = process.env.NODE_ENV === 'production' 
    ? 'https://your-domain.com' 
    : 'http://localhost:3000';

  /**
   * Stage 0: Parameter Intelligence - Smart time range selection
   */
  async getParameterIntelligence(userInput: string, sessionToken: string): Promise<ParameterIntelligenceResult> {
    try {
      logger.info(`🧠 Stage 0: Parameter Intelligence for: ${userInput}`);
      
      // Create time context exactly like test page
      const timeContext = {
        currentDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        currentTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
        currentDateTime: new Date().toISOString()
      };
      
      const response = await fetch(`${this.baseUrl}/api/calendar/parameter-intelligence`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,  // Use session token for API auth
        },
        body: JSON.stringify({
          messages: [  // Match test page format exactly
            {
              role: 'system',
              content: `You are a calendar time range selector. Analyze the user query and pick the best time range.

CURRENT CONTEXT:
- Current Date: ${timeContext.currentDate}
- Current Time: ${timeContext.currentTime}
- Current DateTime: ${timeContext.currentDateTime}

TASK: Choose the best time range duration for the user's query.

OUTPUT ONLY VALID JSON:
{
  "days": 10 | 30 | 100 | 300,
  "maxResults": number,
  "reasoning": "brief explanation"
}

TIME RANGE OPTIONS:
- 10 days: "today", "tomorrow", "next few days", "next week", "this weekend", "this week", "week after"
- 30 days: "this month", "next month"
- 100 days: "this quarter", "next few months"
- 300 days: "this year", "find my trip", "look at everything or all events", "when is [person] birthday"

EXAMPLES:

Query: "what's my schedule for next week"
{"days": 10, "maxResults": 100, "reasoning": "Next week requires 10-day window to capture full week"}

Query: "What's happening this month?"
{"days": 30, "maxResults": 150, "reasoning": "Monthly overview requires 30-day range"}

Query: "Do I have any meetings with David in the next few months?"
{"days": 100, "maxResults": 100, "reasoning": "Person-specific search over extended period needs 100+ days"}

Query: "Any client meetings this quarter?"
{"days": 100, "maxResults": 75, "reasoning": "Quarterly search with specific event type needs 100-day range"}

Query: "When am I going to Korea?"
{"days": 300, "maxResults": 50, "reasoning": "Travel search needs extended timeframe to find future trips"}

Query: "when is james jung birthday"
{"days": 300, "maxResults": 100, "reasoning": "Birthday search needs extended timeframe to find recurring events"}

RULES:
- Output ONLY JSON
- Choose the smallest range that covers the query
- NO searchQuery field - Stage 3 AI will handle filtering
- Focus only on time range and maxResults`
            },
            {
              role: 'user',
              content: userInput
            }
          ]
        }),
      });

      if (!response.ok) {
        throw new Error(`Parameter Intelligence failed: ${response.status}`);
      }

      const paramData = await response.json();
      const paramContent = paramData.content || "{}";
      
      // Parse the response exactly like test page
      let intelligentParams = {
        timeMin: new Date().toISOString(),
        timeMax: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        maxResults: 50
      };
      
      try {
        // Clean the response in case there's markdown formatting
        const cleanedContent = paramContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsedParams = JSON.parse(cleanedContent);
        
        // Convert the new format (days) to the old format (timeMin/timeMax)
        if (parsedParams.days && typeof parsedParams.days === 'number') {
          const now = new Date();
          const endDate = new Date(now.getTime() + (parsedParams.days * 24 * 60 * 60 * 1000));
          
          intelligentParams = {
            timeMin: now.toISOString(),
            timeMax: endDate.toISOString(),
            maxResults: parsedParams.maxResults || 50
          };
        }
             } catch {
         logger.info('Failed to parse parameter intelligence response, using defaults');
       }
      
      logger.info(`✅ Stage 0 Complete: ${JSON.stringify(intelligentParams)}`);
      return intelligentParams;
    } catch (error) {
      logger.error(`❌ Stage 0 Failed: ${error}`);
      throw error;
    }
  }

  /**
   * Stage 1: Raw Google Calendar API - Get calendar data (matches test page exactly)
   */
  async getRawCalendarData(timeRange: ParameterIntelligenceResult, providerToken: string): Promise<RawCalendarData> {
    try {
      logger.info(`📅 Stage 1: Raw Calendar API for range: ${timeRange.timeMin} to ${timeRange.timeMax}`);
      
      // Call Google Calendar API directly like test page
      const params = new URLSearchParams({
        orderBy: 'startTime',
        singleEvents: 'true',
        maxResults: (timeRange.maxResults || 50).toString(),
        timeMin: timeRange.timeMin,
        timeMax: timeRange.timeMax,
      });
      
      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${providerToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Calendar API failed: ${response.status}`);
      }

      const rawData = await response.json();
      
      logger.info(`✅ Stage 1 Complete: ${rawData.items?.length || 0} events found`);
      return rawData;
    } catch (error) {
      logger.error(`❌ Stage 1 Failed: ${error}`);
      throw error;
    }
  }

  /**
   * Stage 2: JSON Table Processing - Clean, structured data
   */
  processCalendarData(rawData: RawCalendarData, timeRange: ParameterIntelligenceResult): CalendarResponse {
    try {
      logger.info('🔄 Stage 2: JSON Table Processing');
      
      const events: CalendarEvent[] = rawData.items?.map((item) => {
        const start = item.start?.dateTime || item.start?.date;
        const end = item.end?.dateTime || item.end?.date;
        const startDate = new Date(start || '');
        const endDate = new Date(end || '');
        
        const isAllDay = !item.start?.dateTime;
        const date = startDate.toISOString().split('T')[0];
        const time = isAllDay 
          ? 'All Day' 
          : `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        
        const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' });

        return {
          id: item.id,
          title: item.summary || 'No Title',
          date,
          time,
          location: item.location || '',
          description: item.description || '',
          status: item.status || 'confirmed',
          htmlLink: item.htmlLink || '',
          isAllDay,
          isRecurring: !!item.recurringEventId,
          day: dayName,
        };
      }) || [];

      const result: CalendarResponse = {
        events,
        summary: `${events.length} events found`,
        dateRange: {
          start: timeRange.timeMin,
          end: timeRange.timeMax,
        },
        totalEvents: events.length,
        hasMoreEvents: events.length >= (timeRange.maxResults || 10),
      };

      logger.info(`✅ Stage 2 Complete: ${events.length} events processed`);
      return result;
    } catch (error) {
      logger.error(`❌ Stage 2 Failed: ${error}`);
      throw error;
    }
  }

  /**
   * Stage 3: AI Final Response - Generate optimized response (matches test page exactly)
   */
  async generateFinalResponse(calendarData: CalendarResponse, userInput: string, sessionToken: string): Promise<string> {
    try {
      logger.info('🤖 Stage 3: AI Final Response');
      
      const response = await fetch(`${this.baseUrl}/api/calendar/stage3-ai-response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionToken}`,  // Use session token for API auth
        },
        body: JSON.stringify({
          userQuery: userInput,  // Match test page parameter name
          jsonTableData: calendarData,  // Match test page parameter name
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Response failed: ${response.status}`);
      }

      const result = await response.json();
      logger.info('✅ Stage 3 Complete');
      return result.content || 'No response generated';  // Match test page response field
    } catch (error) {
      logger.error(`❌ Stage 3 Failed: ${error}`);
      throw error;
    }
  }

  /**
   * Execute the complete 4-stage pipeline
   */
  async execute(userInput: string, providerToken: string, sessionToken: string): Promise<string> {
    try {
      logger.info(`🚀 Starting Calendar Pipeline for: ${userInput}`);
      
      // Stage 0: Parameter Intelligence (uses session token for API auth)
      const timeRange = await this.getParameterIntelligence(userInput, sessionToken);
      
      // Stage 1: Raw Calendar Data (uses provider token for Google Calendar access)
      const rawData = await this.getRawCalendarData(timeRange, providerToken);
      
      // Stage 2: Process Data
      const calendarData = this.processCalendarData(rawData, timeRange);
      
      // Stage 3: AI Final Response (uses session token for API auth)
      const finalResponse = await this.generateFinalResponse(calendarData, userInput, sessionToken);
      
      logger.info('🎉 Calendar Pipeline Complete');
      return finalResponse;
    } catch (error) {
      logger.error(`💥 Calendar Pipeline Failed: ${error}`);
      throw error;
    }
  }
}

export const calendarPipeline = new CalendarPipeline();
