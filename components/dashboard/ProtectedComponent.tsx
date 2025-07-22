"use client";

import { useAuth } from "../../lib/auth/client";
import { Alert, Box, Button, CircularProgress, Typography } from "@mui/material";
import { ReactNode } from "react";

interface ProtectedComponentProps {
  children: ReactNode;
  requiredRole?: "Host" | "Admin" | "SuperAdmin";
  departmentId?: string;
  fallback?: ReactNode;
}

/**
 * A component that protects content based on authentication and authorization
 * 
 * This component can be used to wrap any content that requires authentication
 * and specific role permissions. It will show a loading state, handle
 * unauthenticated users, and restrict access based on roles.
 */
export default function ProtectedComponent({
  children,
  requiredRole = "Host",
  departmentId,
  fallback,
}: ProtectedComponentProps) {
  const { user, isAuthenticated, loading, hasRole, canAccess, logout } = useAuth();

  // Show loading state
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100%" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle unauthenticated users
  if (!isAuthenticated) {
    return (
      <Box p={4}>
        <Alert severity="warning" sx={{ mb: 2 }}>
          You must be logged in to view this content
        </Alert>
        {fallback}
      </Box>
    );
  }

  // Check role-based access
  if (!hasRole(requiredRole)) {
    return (
      <Box p={4}>
        <Alert severity="error" sx={{ mb: 2 }}>
          You don&apos;t have permission to view this content
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          Your role ({user?.role}) doesn&apos;t have sufficient permissions to access this area.
        </Typography>
        <Button variant="contained" onClick={() => logout()}>
          Sign Out
        </Button>
        {fallback}
      </Box>
    );
  }

  // Check department-based access if needed
  if (departmentId && !canAccess(departmentId, requiredRole)) {
    return (
      <Box p={4}>
        <Alert severity="error" sx={{ mb: 2 }}>
          You don&apos;t have access to this department
        </Alert>
        <Typography variant="body1" sx={{ mb: 2 }}>
          You can only access resources in your own department.
        </Typography>
        {fallback}
      </Box>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
}