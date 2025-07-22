/**
 * Test and example functions for authentication
 *
 * These functions demonstrate how to use the authentication system
 * in different contexts (server components, API routes, client components)
 *
 * SECURITY NOTICE:
 * - This file is for demonstration purposes only
 * - In a production environment, these functions should be removed or secured
 */

import { getSession, getCurrentUser, hasRole, canAccessResource } from './session';
import { Session } from 'next-auth';

// Extended user type with departmentId
interface ExtendedUser {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  departmentId?: string | null;
}
import { HostRole } from '../../types/database';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Example of how to protect a server component
 * 
 * This demonstrates how to check authentication and authorization
 * in server components
 */
export async function exampleProtectedServerComponent() {
  const user = await getCurrentUser();
  
  // Check if user is authenticated
  if (!user) {
    return {
      status: 'unauthenticated',
      message: 'You must be logged in to view this content',
      data: null,
    };
  }
  
  // Check if user has required role
  if (!hasRole(user.role, 'Admin')) {
    return {
      status: 'unauthorized',
      message: 'You do not have permission to view this content',
      data: null,
    };
  }
  
  // User is authenticated and authorized
  return {
    status: 'success',
    message: 'Authentication successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  };
}

/**
 * Example of how to protect an API route
 * 
 * This demonstrates how to check authentication and authorization
 * in API routes
 */
export async function exampleProtectedApiRoute(req: NextRequest) {
  const session = await getSession();
  
  // Check if user is authenticated
  if (!session?.user) {
    return NextResponse.json(
      { error: 'You must be logged in to access this resource' },
      { status: 401 }
    );
  }
  
  const user = session.user;
  
  // Check if user has required role
  if (!hasRole(user.role, 'Admin')) {
    return NextResponse.json(
      { error: 'You do not have permission to access this resource' },
      { status: 403 }
    );
  }
  
  // For department-specific resources, check department access
  // Example: Accessing department-specific visitor data
  const departmentId = req.nextUrl.searchParams.get('departmentId');
  
  if (departmentId) {
    const extendedUser = user as ExtendedUser;
    if (!canAccessResource(user.role, extendedUser.departmentId, departmentId)) {
      return NextResponse.json(
        { error: 'You do not have permission to access this department' },
        { status: 403 }
      );
    }
  }
  
  // User is authenticated and authorized
  return NextResponse.json({
    message: 'Authentication successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
}

/**
 * Example for client component usage with next-auth/react hooks
 * 
 * This is a pseudo-code example to demonstrate how to use
 * the useAuth hook in client components. This won't actually run as a function.
 */
export function exampleClientComponentUsage() {
  /*
  'use client';
  
  import { useAuth } from '../auth/client';
  
  export default function ProtectedClientComponent() {
    const { user, isAuthenticated, loading, error, login, logout, hasRole } = useAuth();
    
    // Handle loading state
    if (loading) {
      return <div>Loading...</div>;
    }
    
    // Handle authentication
    if (!isAuthenticated) {
      return (
        <div>
          <h2>Please sign in</h2>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            login(
              formData.get('email') as string,
              formData.get('password') as string
            );
          }}>
            <input name="email" type="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <button type="submit">Sign In</button>
          </form>
          {error && <p className="error">{error}</p>}
        </div>
      );
    }
    
    // Handle authorization based on role
    if (!hasRole('Admin')) {
      return <div>You don't have permission to view this page</div>;
    }
    
    // Render protected content
    return (
      <div>
        <h1>Welcome, {user?.name}</h1>
        <p>Your role: {user?.role}</p>
        <button onClick={() => logout()}>Sign Out</button>
      </div>
    );
  }
  */
  
  return "Example client component usage - see code comments";
}