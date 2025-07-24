"use client";

import { signIn, signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

// Extended user type with departmentId
interface ExtendedUser {
  id?: string;
  name?: string;
  email?: string;
  image?: string;
  role?: string;
  departmentId?: string | null;
}

/**
 * Custom hook for client-side authentication
 *
 * This hook provides functions for signing in, signing out, and checking auth status
 * It also provides loading and error states for better UX
 * Updated to use standard session-based authentication
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  
  const isAuthenticated = status === "authenticated";
  const loading = status === "loading" || isLoading;
  
  // Extract user from session
  const user = session?.user as ExtendedUser | undefined;
  
  /**
   * Sign in with email and password
   *
   * @param email User's email
   * @param password User's password
   * @param callbackUrl URL to redirect to after successful login
   * @returns Whether the login was successful
   */
  const login = async (email: string, password: string, callbackUrl = "/dashboard") => {
    try {
      console.log(`Auth Client: Attempting login for ${email} with callbackUrl: ${callbackUrl}`);
      setIsLoading(true);
      setError(null);
      
      // Perform authentication with NextAuth
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        callbackUrl, // Pass callbackUrl to NextAuth
      });
      
      console.log("Auth Client: SignIn result:", result);
      
      if (result?.error) {
        let errorMessage = "Invalid email or password";
        if (result.error === "No credentials provided") {
          errorMessage = "Please enter your email and password";
        }
        console.error(`Auth Client: Login error - ${errorMessage}`);
        setError(errorMessage);
        return false;
      }
      
      if (!result?.ok) {
        console.error("Auth Client: Login failed with unknown error");
        setError("Login failed. Please try again.");
        return false;
      }
      
      // Authentication successful - let UI handle the redirect
      console.log("Auth Client: Authentication successful");
      
      // Return success - let the login page handle redirection
      return true;
    } catch (err) {
      console.error("Login error:", err);
      setError("An unexpected error occurred. Please try again later.");
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Sign out the current user
   *
   * @param callbackUrl URL to redirect to after signing out
   */
  const logout = async (callbackUrl = "/") => {
    try {
      setIsLoading(true);
      await signOut({ redirect: false });
      router.push(callbackUrl);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Get the user data for API requests
   *
   * @returns The user data
   */
  const getUser = () => {
    return session?.user;
  };
  
  /**
   * Check if the current user has a specific role
   *
   * @param role Required role to check
   * @returns Whether the user has the role
   */
  const hasRole = (role: string): boolean => {
    const userRole = user?.role;
    if (!userRole) return false;
    
    // Role hierarchy: SuperAdmin > Admin > Host
    switch (role) {
      case 'Host':
        return ['Host', 'Admin', 'SuperAdmin'].includes(userRole);
      case 'Admin':
        return ['Admin', 'SuperAdmin'].includes(userRole);
      case 'SuperAdmin':
        return userRole === 'SuperAdmin';
      default:
        return false;
    }
  };
  
  /**
   * Check if the current user belongs to a specific department
   *
   * @param departmentId Department ID to check
   * @returns Whether the user belongs to the department
   */
  const isInDepartment = (departmentId: string): boolean => {
    if (!user) return false;
    
    // SuperAdmin can access all departments
    if (user.role === 'SuperAdmin') return true;
    
    // Access departmentId from user
    return user.departmentId === departmentId;
  };
  
  /**
   * Check if the current user can access a resource with department restrictions
   *
   * @param resourceDepartmentId The department ID of the resource
   * @param requiredRole The minimum role required to access the resource
   * @returns Whether the user can access the resource
   */
  const canAccess = (resourceDepartmentId: string | null, requiredRole = 'Host'): boolean => {
    if (!user?.role) return false;
    
    // Check if user has the required role
    if (!hasRole(requiredRole)) return false;
    
    // If resource has no department, only check role
    if (!resourceDepartmentId) return true;
    
    // SuperAdmin can access all departments
    if (user.role === 'SuperAdmin') return true;
    
    // Admins and Hosts can only access their own department
    return user.departmentId === resourceDepartmentId;
  };
  
  
  return {
    user,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    hasRole,
    isInDepartment,
    canAccess,
    getUser,
  };
}

/**
 * Helper function to add authentication to fetch requests
 *
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    'Content-Type': 'application/json',
  };
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include', // Include cookies in the request
  });
}