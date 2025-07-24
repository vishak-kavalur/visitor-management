import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import dbConnect from '../../../../lib/db/mongoose';
import Host from '../../../../lib/db/models/host';
import { HostDocument } from '../../../../types/database';
import { Headers } from 'next/dist/compiled/@edge-runtime/primitives';

// Define the login schema with Zod
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

/**
 * NextAuth.js configuration
 *
 * This configures authentication for the Visitor Management System:
 * - Uses a credentials provider to authenticate against the Host model
 * - Implements JWT session handling
 * - Adds custom fields to the JWT token and session
 *
 * SECURITY NOTICE:
 * - This implementation uses plaintext password comparison for PoC purposes only
 * - In a production environment, passwords should be properly hashed with bcrypt or Argon2
 * - Additional security measures like rate limiting should be implemented
 */
/**
 * NextAuth.js configuration
 *
 * This configures authentication for the Visitor Management System with a cookie-less approach:
 * - Uses a credentials provider to authenticate against the Host model
 * - Implements token-based authentication without cookies
 * - Returns tokens directly instead of storing in cookies
 * - Adds custom fields to the JWT token and session
 *
 * SECURITY NOTICE:
 * - This implementation uses plaintext password comparison for PoC purposes only
 * - In a production environment, passwords should be properly hashed with bcrypt or Argon2
 * - Additional security measures like rate limiting should be implemented
 */
const handler = NextAuth({
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
          const host = await Host.findByEmail(email);
          
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
            id: host._id?.toString(),
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
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.departmentId = token.departmentId;
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
});

// In Next.js App Router, we export the handler directly
export { handler as GET, handler as POST };