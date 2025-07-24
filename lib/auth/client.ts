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
 * Updated to support token-based authentication without cookies
 */
export function useAuth() {
  const { data: session, status } = useSession();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const router = useRouter();
  
  const isAuthenticated = status === "authenticated" || !!authToken;
  const loading = status === "loading" || isLoading;
  
  // Extract user from session or token
  const user = session?.user as ExtendedUser | undefined;
  
  // Store token in localStorage when session changes
  useEffect(() => {
    if (session?.user) {
      // If we have a session, store it as a token
      const token = JSON.stringify({
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        role: session.user.role,
        departmentId: session.user.departmentId,
        expires: session.expires
      });
      
      // Store in localStorage for API requests
      localStorage.setItem('auth_token', token);
      setAuthToken(token);
    }
  }, [session]);
  
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
      setIsLoading(true);
      setError(null);
      
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        let errorMessage = "Invalid email or password";
        if (result.error === "No credentials provided") {
          errorMessage = "Please enter your email and password";
        }
        setError(errorMessage);
        return false;
      }
      
      // Add token to custom header for future requests
      const authHeader = document.createElement('meta');
      authHeader.httpEquiv = 'x-auth-token';
      authHeader.content = localStorage.getItem('auth_token') || '';
      document.head.appendChild(authHeader);
      
      router.push(callbackUrl);
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
      // Clear token from localStorage
      localStorage.removeItem('auth_token');
      setAuthToken(null);
      
      // Remove custom header
      const authHeader = document.querySelector('meta[http-equiv="x-auth-token"]');
      if (authHeader) {
        authHeader.remove();
      }
      
      await signOut({ redirect: false });
      router.push(callbackUrl);
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Get the authentication token for API requests
   *
   * @returns The authentication token
   */
  const getToken = (): string | null => {
    return localStorage.getItem('auth_token');
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
    getToken,
  };
}

/**
 * Helper function to add auth token to fetch requests
 *
 * @param url The URL to fetch
 * @param options Fetch options
 * @returns The fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth_token');
  
  const headers: Record<string, string> = {
    ...options.headers as Record<string, string>,
    'Content-Type': 'application/json',
  };
  
  if (token) {
    // Add token to Authorization header
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
}