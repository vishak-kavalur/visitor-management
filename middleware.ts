import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

/**
 * Middleware to protect routes based on authentication and role
 * 
 * This middleware runs before requests are processed and can redirect
 * users based on their authentication status and role.
 */
export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Define public paths that don't require authentication
  const isPublicPath = 
    path === '/' || 
    path === '/login' || 
    path.startsWith('/api/') || 
    path.includes('.');

  // Get the token if it exists
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });
  
  const isAuthenticated = !!token;

  // Redirect unauthenticated users to login page
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