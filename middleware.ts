import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

/**
 * Middleware to protect routes based on authentication and role
 *
 * This middleware runs before requests are processed and can redirect
 * users based on their authentication status and role.
 * Updated to support token-based authentication without cookies.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if web authentication is enabled (default to true if not specified)
  const webAuthEnabled = process.env.WEB_AUTH_ENABLED !== 'false';
  
  // If web authentication is disabled, all paths are considered public
  if (!webAuthEnabled) {
    return NextResponse.next();
  }
  
  // Define public paths that don't require authentication
  const isPublicPath =
    path === '/' ||
    path === '/login' ||
    path.startsWith('/api/') || // All API endpoints are public for POC
    path.includes('.');

  // Get token from Authorization header if it exists
  let token = null;
  const authHeader = request.headers.get('authorization');
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const tokenString = authHeader.substring(7);
    try {
      // If the header contains a valid token, use it
      token = JSON.parse(tokenString);
    } catch (error) {
      console.error('Invalid token format in header', error);
    }
  }

  // Fallback: Check for token in custom header (for web pages)
  if (!token) {
    const customTokenHeader = request.headers.get('x-auth-token');
    if (customTokenHeader) {
      try {
        token = JSON.parse(customTokenHeader);
      } catch (error) {
        console.error('Invalid token format in custom header', error);
      }
    }
  }
  
  const isAuthenticated = !!token;

  // Redirect unauthenticated users to login page (only for web pages, not for API routes)
  if (!isPublicPath && !isAuthenticated) {
    return NextResponse.redirect(
      new URL(`/login?callbackUrl=${encodeURIComponent(path)}`, request.url)
    );
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && path === '/login') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check for role-based access
  if (isAuthenticated && path.startsWith('/dashboard/admin') && token.role !== 'SuperAdmin') {
    // Redirect non-SuperAdmin users trying to access admin sections
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

// Configure which paths the middleware applies to
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /_next (Next.js internals)
     * 2. /api/auth (NextAuth.js API routes)
     * 3. /static (public files)
     * 4. /_vercel (Vercel internals)
     * 5. All files in the public folder
     */
    '/((?!_next|api/auth|static|_vercel|favicon.ico|robots.txt).*)',
  ],
};