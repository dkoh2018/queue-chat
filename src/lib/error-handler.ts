import { NextResponse } from 'next/server';

export interface APIError {
  message: string;
  code?: string;
  status: number;
}

export class APIErrorHandler {
  static handle(error: unknown, _context?: string): NextResponse {
    // Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as { code: string; message: string };
      return NextResponse.json({
        error: supabaseError.message || 'Database operation failed',
        code: supabaseError.code
      }, { status: 500 });
    }

    // Standard errors
    if (error instanceof Error) {
      return NextResponse.json({
        error: error.message
      }, { status: 500 });
    }

    // Unknown errors
    return NextResponse.json({
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }

  static unauthorized(message = 'Authentication required'): NextResponse {
    return NextResponse.json({ error: message }, { status: 401 });
  }

  static forbidden(message = 'Access denied'): NextResponse {
    return NextResponse.json({ error: message }, { status: 403 });
  }

  static notFound(message = 'Resource not found'): NextResponse {
    return NextResponse.json({ error: message }, { status: 404 });
  }

  static badRequest(message = 'Invalid request'): NextResponse {
    return NextResponse.json({ error: message }, { status: 400 });
  }

  static rateLimit(message = 'Rate limit exceeded'): NextResponse {
    return NextResponse.json({ error: message }, { status: 429 });
  }
}
