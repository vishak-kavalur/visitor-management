import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware to protect routes based on authentication and role
 *
 * This middleware runs before requests are processed and can redirect
 * users based on their authentication status and role.
 * Updated to use standard NextAuth.js JWT token authentication.
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

  // Get the session token using NextAuth's built-in method
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  const isAuthenticated = !!token;

  // Redirect unauthenticated users to login page (only for web pages, not for API routes)
  if (!isPublicPath && !isAuthenticated) {
    const searchParams = new URLSearchParams();
    // Properly encode the callback URL to prevent issues with special characters
    searchParams.set('callbackUrl', path);
    console.log(`Middleware: Redirecting unauthenticated user from ${path} to login page with callback`);
    return NextResponse.redirect(
      new URL(`/login?${searchParams.toString()}`, request.url)
    );
  }

  // Redirect authenticated users away from login page
  if (isAuthenticated && path === '/login') {
    // Check if there's a callbackUrl in the query parameters
    const callbackUrl = request.nextUrl.searchParams.get('callbackUrl');
    const targetUrl = callbackUrl || '/dashboard';
    console.log(`Middleware: Redirecting authenticated user from login to ${targetUrl}`);
    
    // Ensure we don't create a redirect loop by checking the target URL
    if (targetUrl === '/login') {
      // Avoid redirect loop by forcing dashboard redirect
      console.log('Middleware: Avoiding redirect loop by redirecting to dashboard');
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    
    // Redirect to the callbackUrl if it exists, otherwise to dashboard
    return NextResponse.redirect(new URL(targetUrl, request.url));
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