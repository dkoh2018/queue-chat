import { supabase } from '@/lib/supabase';

/**
 * Get Google provider token from current session (frontend only)
 */
export async function getSessionProviderToken(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.provider_token || null;
  } catch (error) {
    console.error('Failed to get session provider token:', error);
    return null;
  }
}

/**
 * Call calendar API with session token (frontend only)
 */
export async function callCalendarAPI(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const providerToken = await getSessionProviderToken();
  
  if (!providerToken) {
    throw new Error('No provider token available. Please sign in again.');
  }

  const url = new URL(endpoint, window.location.origin);
  
  if (options.method === 'GET' || !options.method) {
    // For GET requests, add token as query parameter
    url.searchParams.set('providerToken', providerToken);
    return fetch(url.toString(), options);
  } else {
    // For POST requests, add token to body
    const body = options.body ? JSON.parse(options.body as string) : {};
    body.providerToken = providerToken;
    
    return fetch(endpoint, {
      ...options,
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  }
}

/**
 * Test calendar connection (frontend only)
 */
export async function testCalendarConnection(userId: string): Promise<unknown> {
  const providerToken = await getSessionProviderToken();
  
  if (!providerToken) {
    throw new Error('No provider token available. Please sign in again.');
  }

  const response = await fetch('/api/test/calendar-simple', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      query: 'Test calendar connection',
      providerToken
    })
  });

  if (!response.ok) {
    throw new Error(`Calendar test failed: ${response.status}`);
  }

  return response.json();
} 