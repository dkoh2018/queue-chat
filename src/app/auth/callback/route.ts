import { NextRequest, NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            cookieStore.delete({ name, ...options })
          },
        },
      }
    )

    // Exchange code for session and capture provider tokens
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)
    
    // Auth callback - Exchange result logged
    
    if (!error && data.session) {
      const { provider_token, provider_refresh_token, user } = data.session
      
      // Store provider tokens if they exist
      if (provider_token && user) {
        try {
          // First, create the table if it doesn't exist (for development)
          await supabase.rpc('exec', {
            sql: `
              CREATE TABLE IF NOT EXISTS user_oauth_tokens (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
                provider TEXT NOT NULL,
                provider_token TEXT NOT NULL,
                provider_refresh_token TEXT,
                token_expires_at TIMESTAMPTZ,
                scopes TEXT,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW(),
                UNIQUE(user_id, provider)
              );
            `
          })
        } catch {
          // Table might already exist - this is expected in some cases
        }

        // Store the tokens
        const { error: tokenError } = await supabase
          .from('user_oauth_tokens')
          .upsert({
            user_id: user.id,
            provider: 'google',
            provider_token,
            provider_refresh_token,
            scopes: 'openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
            updated_at: new Date().toISOString()
          })

        if (tokenError) {
          // Failed to store OAuth tokens - this may affect calendar functionality
        } else {
          // Successfully stored OAuth tokens for user
        }
      }
    }
  }

  // Redirect to home page after authentication
  return NextResponse.redirect(requestUrl.origin)
}