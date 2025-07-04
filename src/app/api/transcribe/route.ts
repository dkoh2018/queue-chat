import { NextResponse } from 'next/server';
import OpenAI from 'openai';

// Security constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB (30 seconds of audio should be ~1-2MB)
const ALLOWED_TYPES = [
  'audio/webm',
  'audio/mp4', 
  'audio/mpeg',
  'audio/wav',
  'audio/m4a'
];

// Rate limiting (simple in-memory for single-user app)
const transcriptionRequests = new Map<string, number[]>();
const RATE_LIMIT = {
  maxRequests: 10, // 10 requests per minute
  windowMs: 60 * 1000, // 1 minute
};

function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const requests = transcriptionRequests.get(clientId) || [];
  
  // Remove old requests outside the window
  const validRequests = requests.filter(time => now - time < RATE_LIMIT.windowMs);
  
  if (validRequests.length >= RATE_LIMIT.maxRequests) {
    return false; // Rate limit exceeded
  }
  
  // Add current request
  validRequests.push(now);
  transcriptionRequests.set(clientId, validRequests);
  
  return true;
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // Check API key
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Missing OPENAI_API_KEY');
      return NextResponse.json({ error: 'Service configuration error' }, { status: 500 });
    }

    // Simple rate limiting (using IP as client ID)
    const clientId = request.headers.get('x-forwarded-for') || 'localhost';
    if (!checkRateLimit(clientId)) {
      return NextResponse.json({ 
        error: 'Rate limit exceeded. Please wait before making another request.' 
      }, { status: 429 });
    }

    // Parse form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;

    // Validation: Check if file exists
    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Validation: Check file size
    if (audioFile.size > MAX_FILE_SIZE) {
      console.warn(`File too large: ${audioFile.size} bytes`);
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` 
      }, { status: 413 });
    }

    // Validation: Check file type
    if (!ALLOWED_TYPES.includes(audioFile.type)) {
      console.warn(`Invalid file type: ${audioFile.type}`);
      return NextResponse.json({ 
        error: `Invalid file type. Allowed types: ${ALLOWED_TYPES.join(', ')}` 
      }, { status: 400 });
    }

    // Validation: Check if file is empty
    if (audioFile.size === 0) {
      return NextResponse.json({ error: 'Empty audio file' }, { status: 400 });
    }

    console.log('🎤 Processing audio file:', {
      name: audioFile.name,
      type: audioFile.type,
      size: `${(audioFile.size / 1024).toFixed(1)}KB`,
      clientId
    });

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: apiKey,
    });

    // Convert file to buffer for OpenAI API
    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    // Create a new File object for OpenAI (required format)
    const openaiFile = new File([buffer], 'audio.webm', { 
      type: audioFile.type 
    });

    // Call OpenAI Whisper API
    console.log('🔊 Calling OpenAI Whisper API...');
    const transcriptionStart = Date.now();
    
    const transcription = await openai.audio.transcriptions.create({
      file: openaiFile,
      model: 'whisper-1',
      language: 'en', // Optimize for English
      response_format: 'text', // Get plain text response
      temperature: 0.2, // Lower temperature for more consistent transcription
    });

    const transcriptionTime = Date.now() - transcriptionStart;
    const totalTime = Date.now() - startTime;

    console.log('✅ Transcription completed:', {
      transcriptionTime: `${transcriptionTime}ms`,
      totalTime: `${totalTime}ms`,
      textLength: transcription.length,
      preview: transcription.slice(0, 50) + (transcription.length > 50 ? '...' : '')
    });

    // Return successful response
    return NextResponse.json({
      transcription: transcription,
      metadata: {
        fileSize: audioFile.size,
        fileType: audioFile.type,
        processingTime: totalTime,
        timestamp: new Date().toISOString(),
      }
    });

  } catch (error) {
    const totalTime = Date.now() - startTime;
    
    console.error('❌ Transcription error:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      processingTime: `${totalTime}ms`
    });

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit')) {
        return NextResponse.json({ 
          error: 'OpenAI rate limit exceeded. Please try again later.' 
        }, { status: 429 });
      }
      
      if (error.message.includes('invalid_request')) {
        return NextResponse.json({ 
          error: 'Invalid audio file format or content.' 
        }, { status: 400 });
      }
      
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json({ 
          error: 'Service temporarily unavailable.' 
        }, { status: 503 });
      }
    }

    // Generic error response (don't expose internal details)
    return NextResponse.json({ 
      error: 'Failed to transcribe audio. Please try again.' 
    }, { status: 500 });
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}
