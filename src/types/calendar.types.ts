export interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  location?: string;
  attendees?: Array<{
    email: string;
    displayName?: string;
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted';
  }>;
  status?: 'confirmed' | 'tentative' | 'cancelled';
  htmlLink?: string;
}

export interface CalendarListResponse {
  kind: string;
  etag: string;
  summary: string;
  items: CalendarEvent[];
  nextPageToken?: string;
}

export interface CalendarContext {
  todayEvents: CalendarEvent[];
  tomorrowEvents: CalendarEvent[];
  thisWeekEvents: CalendarEvent[];
  nextWeekEvents: CalendarEvent[];
  upcomingEvents: CalendarEvent[];
  totalEvents: number;
  timeZone: string;
  lastUpdated: string;
}

export interface CalendarAvailability {
  date: string;
  isAvailable: boolean;
  busySlots: Array<{
    start: string;
    end: string;
    summary: string;
  }>;
  freeSlots: Array<{
    start: string;
    end: string;
  }>;
}