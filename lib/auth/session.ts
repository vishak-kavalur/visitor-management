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
};

/**
 * Get the current user's session from the server
 * 
 * This function should be used in server components and API routes
 * to get the current user's session.
 */
export async function getSession() {
  return await getServerSession(authOptions);
}

/**
 * Get the current user from the session
 * 
 * This function should be used in server components and API routes
 * to get the current user.
 */
export async function getCurrentUser() {
  const session = await getSession();
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