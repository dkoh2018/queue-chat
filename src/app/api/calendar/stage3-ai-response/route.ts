import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-utils';
import { logger } from '@/utils';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { userQuery, jsonTableData } = await request.json();
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
    }

    if (!userQuery || !jsonTableData) {
      return NextResponse.json({ error: 'Missing userQuery or jsonTableData' }, { status: 400 });
    }

    // Create a focused prompt for Stage 3 AI processing
    const stage3Prompt = `You are a calendar assistant analyzing structured calendar data to answer user queries.

USER QUERY: "${userQuery}"

CALENDAR DATA (JSON Table Format):
${JSON.stringify(jsonTableData, null, 2)}

INSTRUCTIONS:
1. Analyze the calendar data above to answer the user's query
2. Look for exact matches, partial matches, and related events
3. For birthday queries, look for events with "birthday" in the title
4. For scheduling queries, focus on dates, times, and availability
5. Provide specific dates, times, and details when found
6. If no relevant events are found, clearly state that
7. When showing multiple events, ALWAYS format them as a markdown table
8. After the table, provide a conversational explanation answering the user's specific question

**FORMATTING REQUIREMENTS:**
- Use proper markdown table syntax with | separators
- Columns: Date | Time | Event | Location | Description
- Use "N/A" for empty/null fields
- Keep descriptions concise (max 50 characters)
- Sort events chronologically
- Format dates as YYYY-MM-DD
- Include day of week in parentheses after date

**RESPONSE STRUCTURE:**
For multiple events:
1. Brief intro sentence
2. Markdown table with all relevant events
3. Conversational summary addressing the specific query

For single events:
1. Direct answer with event details
2. Conversational context

**EXAMPLE RESPONSE FORMAT:**
Here are your upcoming events:
| Date | Time | Event | Location |
|------|------|-------|----------|
| 2025-07-07 (Monday) | 5:45 PM - 9:15 PM | CSC450 - OOP | CDM 106 |
| 2025-07-09 (Wednesday) | 1:00 PM - 2:15 PM | HAIRCUT | N/A |
| 2025-07-12 (Saturday) | 6:00 PM - 6:30 PM | Cyber truck TEST DRIVE | Tesla, Schaumburg |

Based on your calendar, you have a busy week ahead with your OOP class on Monday, a haircut appointment on Wednesday, and an exciting Cybertruck test drive on Saturday!

Answer the user's query based on the calendar data provided:`;

    // Call OpenAI with the focused prompt
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: stage3Prompt
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0.1 // Lower temperature for more consistent responses
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error('OpenAI API error in Stage 3', 'STAGE3', { error, status: response.status });
      return NextResponse.json({ error: `OpenAI API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? '';

    logger.info('Stage 3 AI response completed', 'STAGE3', {
      userId: user.id,
      queryLength: userQuery.length,
      responseLength: content.length,
      eventsProcessed: jsonTableData.totalEvents || 0
    });

    return NextResponse.json({
      content,
      success: true
    });

  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
    logger.error('Stage 3 API error', 'STAGE3', err);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 