import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME } from '@/lib/config';

// First line of defence: redirect visitors with no session flag. It cannot verify the token or the role
// (the token is in localStorage); AuthGuard + the backend's 401/403 do the real checks.
export function middleware(request: NextRequest) {
  if (request.cookies.has(AUTH_COOKIE_NAME)) return NextResponse.next();
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: ['/dashboard/:path*', '/admin/:path*'] };
