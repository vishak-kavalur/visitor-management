import NextAuth from 'next-auth/next';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import dbConnect from '../../../../lib/db/mongoose';
import Host from '../../../../lib/db/models/host';

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
 * - Implements JWT session handling with HTTP-only cookies
 * - Adds custom fields to the JWT token and session
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

          // Check if passwords match - depending on how they're stored
          let isValidPassword;
          
          // Handle both hashed and plaintext passwords
          if (host.password.startsWith('$2')) {
            // Password is bcrypt hashed
            isValidPassword = await bcrypt.compare(password, host.password);
          } else {
            // Password is plaintext (for PoC as mentioned in Host model)
            isValidPassword = password === host.password;
          }

          if (!isValidPassword) {
            console.error('!! Authentication failed: Invalid credentials');
            return null;
          }

          console.log('Authentication successful for user:', host.email);
          
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
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.departmentId = user.departmentId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.departmentId = token.departmentId;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
});

export { handler as GET, handler as POST };