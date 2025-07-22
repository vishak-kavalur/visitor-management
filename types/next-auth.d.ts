import NextAuth, { DefaultSession, DefaultUser } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Extending the User type
   */
  interface User extends DefaultUser {
    role?: string
    id?: string
    departmentId?: string | null
  }

  /**
   * Extending the Session type
   */
  interface Session {
    user: {
      id?: string
      name?: string
      email?: string
      image?: string
      role?: string
      departmentId?: string | null
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  /** Extending the JWT token */
  interface JWT {
    role?: string
    id?: string
    departmentId?: string | null
  }
}