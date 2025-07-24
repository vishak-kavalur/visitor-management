import { getServerSession } from "next-auth/next";
import { NextAuthOptions } from "next-auth";
import { HostRole } from "../../types/database";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from 'zod';
import dbConnect from "../db/mongoose";
import Host from "../db/models/host";

// Define the login schema with Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

// Define the NextAuth options to use for getServerSession
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials) {
            throw new Error('No credentials provided');
          }

          // Validate credentials using Zod
          const { email, password } = loginSchema.parse(credentials);

          // Connect to the database
          await dbConnect();

          // Find the host by email
          const host = await Host.findByEmail(email) as {
            _id: { toString: () => string },
            fullName: string,
            email: string,
            password: string,
            role: string,
            departmentId?: { toString: () => string } | null
          } | null;
          
          if (!host) {
            console.error('Authentication failed: Account not found');
            return null;
          }

          // Compare passwords
          // WARNING: This compares plaintext passwords for PoC only
          // In production, this should use a proper password hashing library
          const isValidPassword = host.password === password;

          if (!isValidPassword) {
            console.error('Authentication failed: Invalid credentials');
            return null;
          }

          // Return user data for token generation (excluding password)
          return {
            id: host._id.toString(),
            name: host.fullName,
            email: host.email,
            role: host.role,
            departmentId: host.departmentId ? host.departmentId.toString() : null
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add role, departmentId and other custom fields to the token
      if (user) {
        token.role = user.role as string;
        token.id = user.id as string;
        token.departmentId = user.departmentId || null;
      }
      return token;
    },
    async session({ session, token }) {
      // Add custom fields to the session
      if (session.user) {
        session.user.role = token.role as string;
        session.user.id = token.id as string;
        session.user.departmentId = token.departmentId as string | null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
  // For a POC, we're using header-based token auth instead of cookies
  useSecureCookies: false,
  jwt: {
    // Disable cookie encryption to allow custom token handling
    encode: async ({ token, secret }) => {
      if (!token) return "";
      return JSON.stringify(token);
    },
    decode: async ({ token, secret }) => {
      if (!token) return null;
      try {
        return JSON.parse(token);
      } catch (e) {
        return null;
      }
    },
  },
};

/**
 * Get the current user's session from the server or from request headers
 *
 * This function should be used in server components and API routes
 * to get the current user's session. It supports both NextAuth's getServerSession
 * and reading from Authorization header for API access.
 *
 * @param request Optional request object to extract token from headers
 */
export async function getSession(request?: Request) {
  // First try to get the session from NextAuth (for web pages)
  const nextAuthSession = await getServerSession(authOptions);
  if (nextAuthSession) return nextAuthSession;
  
  // If that fails and we have a request, try to get from Authorization header
  if (request) {
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const tokenString = authHeader.substring(7);
        const token = JSON.parse(tokenString);
        
        // Construct a session-like object from the token
        return {
          user: {
            id: token.id,
            name: token.name,
            email: token.email,
            role: token.role,
            departmentId: token.departmentId
          },
          expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        };
      } catch (error) {
        console.error('Error parsing token from Authorization header:', error);
      }
    }
    
    // Try the custom header as well
    const customTokenHeader = request.headers.get('x-auth-token');
    if (customTokenHeader) {
      try {
        const token = JSON.parse(customTokenHeader);
        return {
          user: {
            id: token.id,
            name: token.name,
            email: token.email,
            role: token.role,
            departmentId: token.departmentId
          },
          expires: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
        };
      } catch (error) {
        console.error('Error parsing token from custom header:', error);
      }
    }
  }
  
  return null;
}

/**
 * Get the current user from the session or token
 *
 * This function should be used in server components and API routes
 * to get the current user.
 *
 * @param request Optional request object to extract token from headers
 */
export async function getCurrentUser(request?: Request) {
  const session = await getSession(request);
  return session?.user;
}

/**
 * Check if a user has a specific role
 * 
 * @param userRole The user's role
 * @param requiredRole The required role
 * @returns Whether the user has the required role
 */
export function hasRole(userRole: string | undefined, requiredRole: HostRole): boolean {
  if (!userRole) return false;
  
  // Role hierarchy: SuperAdmin > Admin > Host
  switch (requiredRole) {
    case 'Host':
      return ['Host', 'Admin', 'SuperAdmin'].includes(userRole);
    case 'Admin':
      return ['Admin', 'SuperAdmin'].includes(userRole);
    case 'SuperAdmin':
      return userRole === 'SuperAdmin';
    default:
      return false;
  }
}

/**
 * Check if a user has access to a department
 * 
 * @param userRole The user's role
 * @param userDepartmentId The user's department ID
 * @param targetDepartmentId The target department ID
 * @returns Whether the user has access to the department
 */
export function hasDepartmentAccess(
  userRole: string | undefined, 
  userDepartmentId: string | undefined | null, 
  targetDepartmentId: string
): boolean {
  if (!userRole) return false;
  
  // SuperAdmins have access to all departments
  if (userRole === 'SuperAdmin') return true;
  
  // Admins and Hosts only have access to their own department
  return userDepartmentId === targetDepartmentId;
}

/**
 * Check if a user can access a resource
 * 
 * @param userRole The user's role
 * @param userDepartmentId The user's department ID
 * @param resourceDepartmentId The resource's department ID
 * @param requiredRole The minimum role required to access the resource
 * @returns Whether the user can access the resource
 */
export function canAccessResource(
  userRole: string | undefined,
  userDepartmentId: string | undefined | null,
  resourceDepartmentId: string | undefined | null,
  requiredRole: HostRole = 'Host'
): boolean {
  if (!userRole) return false;
  
  // Check if user has the required role
  if (!hasRole(userRole, requiredRole)) return false;
  
  // If resource has no department, only check role
  if (!resourceDepartmentId) return true;
  
  // SuperAdmins can access all departments
  if (userRole === 'SuperAdmin') return true;
  
  // Admins and Hosts can only access their own department
  return userDepartmentId === resourceDepartmentId;
}

/**
 * Generate a permission error response
 * 
 * @param message The error message
 * @returns A standardized error response
 */
export function createPermissionError(message: string = "You don't have permission to perform this action") {
  return {
    error: message,
    status: 403,
    success: false
  };
}

/**
 * Generate an authentication error response
 * 
 * @param message The error message
 * @returns A standardized error response
 */
export function createAuthError(message: string = "Authentication required") {
  return {
    error: message,
    status: 401,
    success: false
  };
}