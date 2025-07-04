import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { userInput, conversationHistory = [] } = await request.json();
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

  if (!userInput || typeof userInput !== 'string') {
    return NextResponse.json({ error: 'Invalid user input' }, { status: 400 });
  }

  try {
    // Build context-aware system prompt
    let systemPrompt = "You are an input optimization assistant. When a user provides unclear, abbreviated, or poorly formatted text, analyze their intent and rewrite their input as if you were them, but with proper grammar, spelling, and structure. Do NOT ask for clarification. Instead: 1) Identify the core intent/request from context clues, 2) Rewrite their input in first person as a clear, detailed request, 3) Maintain their original tone and intent, 4) Fill in reasonable details based on context. Transform gibberish into professional, clear communication while preserving what the user actually wants to accomplish.";
    
    if (conversationHistory.length > 0) {
      systemPrompt += "\n\nConsider the conversation context to make the optimized input more relevant and specific to the ongoing discussion. Reference previous topics when appropriate.";
    }

    // Add diagram detection instruction
    systemPrompt += "\n\nIMPORTANT: Also analyze if the user is requesting any kind of diagram, chart, flowchart, visualization, or Mermaid diagram. If they are, respond with 'DIAGRAM_REQUEST: true' at the beginning of your response.";

    // Add calendar detection instruction
    systemPrompt += "\n\nCALENDAR DETECTION: Also analyze if the user is asking about scheduling, calendar, appointments, meetings, events, availability, time management, or any time-related requests. If they are, respond with 'CALENDAR_REQUEST: true' at the beginning of your response (can be combined with DIAGRAM_REQUEST if both apply).";

    // Prepare messages for optimization
    const optimizationMessages = [
      {
        role: 'system',
        content: systemPrompt
      }
    ];

    // Add conversation history for context (last 10 message pairs = 20 messages max)
    // If history is too long, trim to most recent 16 messages to leave room for system + user prompt
    let recentHistory = conversationHistory.slice(-16);
    
    // Estimate token count (rough approximation: 1 token ≈ 4 characters)
    const estimatedTokens = JSON.stringify(optimizationMessages.concat(recentHistory)).length / 4;
    
    // If still too long, further trim history
    if (estimatedTokens > 3000) {
      recentHistory = conversationHistory.slice(-10);
    }
    
    optimizationMessages.push(...recentHistory);

    // Add the current user input
    optimizationMessages.push({
      role: 'user',
      content: `Please optimize this user input: "${userInput}"`
    });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ 
        model: 'gpt-4o-mini', 
        messages: optimizationMessages,
        temperature: 0.7,
        max_tokens: 1500, // Increased for longer context-aware optimizations
        presence_penalty: 0.1, // Encourage diverse responses
        frequency_penalty: 0.1 // Reduce repetition
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json({ error }, { status: response.status });
    }

    const data = await response.json();
    const optimizedInput = data.choices?.[0]?.message?.content ?? userInput;

    // Check for request type flags
    const isDiagramRequest = optimizedInput.includes('DIAGRAM_REQUEST: true');
    const isCalendarRequest = optimizedInput.includes('CALENDAR_REQUEST: true');
    
    // Clean the optimized input by removing flags
    let cleanOptimizedInput = optimizedInput;
    if (isDiagramRequest) {
      cleanOptimizedInput = cleanOptimizedInput.replace('DIAGRAM_REQUEST: true', '').trim();
    }
    if (isCalendarRequest) {
      cleanOptimizedInput = cleanOptimizedInput.replace('CALENDAR_REQUEST: true', '').trim();
    }

    // Log optimization comparison
    console.log('🔧 INPUT OPTIMIZATION:');
    console.log(`   Original: "${userInput.slice(0, 80)}${userInput.length > 80 ? '...' : ''}"`);
    console.log(`   Optimized: "${cleanOptimizedInput.slice(0, 80)}${cleanOptimizedInput.length > 80 ? '...' : ''}"`);
    console.log(`   Improvement: ${cleanOptimizedInput.length - userInput.length > 0 ? '+' : ''}${cleanOptimizedInput.length - userInput.length} chars`);
    if (isDiagramRequest) {
      console.log('📊 DIAGRAM REQUEST DETECTED');
    }
    if (isCalendarRequest) {
      console.log('📅 CALENDAR REQUEST DETECTED');
    }

    return NextResponse.json({
      originalInput: userInput,
      optimizedInput: cleanOptimizedInput,
      isDiagramRequest: isDiagramRequest,
      isCalendarRequest: isCalendarRequest
    });
  } catch (err: unknown) {
    console.error('Input optimization error:', err);
    // Fallback to original input if optimization fails
    return NextResponse.json({ 
      originalInput: userInput,
      optimizedInput: userInput,
      isDiagramRequest: false,
      isCalendarRequest: false,
      error: 'Optimization failed, using original input'
    });
  }
}