import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          req.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // Check auth status
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Define route patterns
  const isAuthCallback = req.nextUrl.pathname === '/auth/callback';
  const isLoginPage = req.nextUrl.pathname === '/login';
  const isProtectedRoute = req.nextUrl.pathname === '/' ||
                          req.nextUrl.pathname.startsWith('/chat') ||
                          req.nextUrl.pathname.startsWith('/conversations');

  // Allow auth callback to proceed
  if (isAuthCallback) {
    return response;
  }

  // Handle unauthenticated users
  if (!session) {
    if (isProtectedRoute) {
      // Redirect to login page
      const redirectUrl = new URL('/login', req.url);
      return NextResponse.redirect(redirectUrl);
    }
    // Allow access to public routes (login page, etc.)
    return response;
  }

  // Handle authenticated users
  if (session && isLoginPage) {
    // Redirect authenticated users away from login page
    const redirectUrl = new URL('/', req.url);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
