import { CalendarEvent, CalendarListResponse, CalendarContext } from '@/types/calendar.types';
import { logger } from '@/utils';

class CalendarService {
  private readonly CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

  /**
   * Get calendar events for a specific time range
   */
  async getEvents(
    accessToken: string, 
    timeMin?: string, 
    timeMax?: string,
    maxResults: number = 50
  ): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        orderBy: 'startTime',
        singleEvents: 'true',
        maxResults: maxResults.toString(),
      });

      if (timeMin) params.append('timeMin', timeMin);
      if (timeMax) params.append('timeMax', timeMax);

      const response = await fetch(
        `${this.CALENDAR_API_BASE}/calendars/primary/events?${params}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Calendar API error: ${response.status} ${response.statusText}`);
      }

      const data: CalendarListResponse = await response.json();
      return data.items || [];
    } catch (error) {
      logger.error('Failed to fetch calendar events', 'CALENDAR', error);
      throw error;
    }
  }

  /**
   * Get comprehensive calendar context for AI
   */
  async getCalendarContext(accessToken: string): Promise<CalendarContext> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      
      const thisWeekEnd = new Date(thisWeekStart);
      thisWeekEnd.setDate(thisWeekStart.getDate() + 6); // End of week (Saturday)
      
      const nextWeekStart = new Date(thisWeekEnd);
      nextWeekStart.setDate(thisWeekEnd.getDate() + 1);
      
      const nextWeekEnd = new Date(nextWeekStart);
      nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

      const upcomingEnd = new Date(now);
      upcomingEnd.setDate(now.getDate() + 30); // Next 30 days

      // Fetch events for different time ranges
      const [todayEvents, tomorrowEvents, thisWeekEvents, nextWeekEvents, upcomingEvents] = await Promise.all([
        this.getEvents(accessToken, today.toISOString(), tomorrow.toISOString()),
        this.getEvents(accessToken, tomorrow.toISOString(), new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000).toISOString()),
        this.getEvents(accessToken, thisWeekStart.toISOString(), thisWeekEnd.toISOString()),
        this.getEvents(accessToken, nextWeekStart.toISOString(), nextWeekEnd.toISOString()),
        this.getEvents(accessToken, now.toISOString(), upcomingEnd.toISOString(), 100)
      ]);

      const context: CalendarContext = {
        todayEvents,
        tomorrowEvents,
        thisWeekEvents,
        nextWeekEvents,
        upcomingEvents,
        totalEvents: upcomingEvents.length,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        lastUpdated: now.toISOString()
      };

      logger.info('Calendar context fetched successfully', 'CALENDAR', {
        todayCount: todayEvents.length,
        tomorrowCount: tomorrowEvents.length,
        thisWeekCount: thisWeekEvents.length,
        nextWeekCount: nextWeekEvents.length,
        totalUpcoming: upcomingEvents.length
      });

      return context;
    } catch (error) {
      logger.error('Failed to get calendar context', 'CALENDAR', error);
      throw error;
    }
  }



  /**
   * Format calendar context for AI consumption
   */
  formatCalendarContextForAI(context: CalendarContext): string {
    const formatEvent = (event: CalendarEvent) => {
      const start = event.start.dateTime || event.start.date;
      const time = start ? new Date(start).toLocaleString() : 'No time';
      return `• ${time}: ${event.summary}${event.location ? ` (${event.location})` : ''}`;
    };

    let formatted = `CALENDAR CONTEXT (${context.timeZone}):\n\n`;

    if (context.todayEvents.length > 0) {
      formatted += `TODAY'S SCHEDULE:\n${context.todayEvents.map(formatEvent).join('\n')}\n\n`;
    } else {
      formatted += `TODAY'S SCHEDULE: No events scheduled\n\n`;
    }

    if (context.tomorrowEvents.length > 0) {
      formatted += `TOMORROW'S SCHEDULE:\n${context.tomorrowEvents.map(formatEvent).join('\n')}\n\n`;
    } else {
      formatted += `TOMORROW'S SCHEDULE: No events scheduled\n\n`;
    }

    if (context.thisWeekEvents.length > 0) {
      formatted += `THIS WEEK'S EVENTS:\n${context.thisWeekEvents.slice(0, 10).map(formatEvent).join('\n')}\n\n`;
    }

    if (context.nextWeekEvents.length > 0) {
      formatted += `NEXT WEEK'S EVENTS:\n${context.nextWeekEvents.slice(0, 5).map(formatEvent).join('\n')}\n\n`;
    }

    formatted += `TOTAL UPCOMING EVENTS: ${context.totalEvents}`;

    return formatted;
  }
}

// Export singleton instance
export const calendarService = new CalendarService();