'use client';

import { useEffect } from 'react';
import { Typography, Paper, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import DepartmentsDataTable from '../../../components/departments/DepartmentsDataTable';
import { useAuth } from '../../../lib/auth/client';

export default function DepartmentsPage() {
  const { user, hasRole, loading } = useAuth();
  const router = useRouter();
  
  // Check if user has SuperAdmin role
  useEffect(() => {
    if (!loading && user && !hasRole('SuperAdmin')) {
      // Redirect unauthorized users
      router.push('/dashboard');
    }
  }, [user, hasRole, loading, router]);

  if (loading) {
    return (
      <DashboardLayout>
        <Typography>Loading...</Typography>
      </DashboardLayout>
    );
  }

  // Render only if user has SuperAdmin role
  if (!user || !hasRole('SuperAdmin')) {
    return (
      <DashboardLayout>
        <Alert severity="error">
          You do not have permission to access this page. Only SuperAdmin users can manage departments.
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Departments Management
      </Typography>
      <Typography variant="body1" paragraph>
        Manage organizational departments in the system. This section is restricted to SuperAdmin users only.
      </Typography>
      <Paper sx={{ p: 2 }}>
        <DepartmentsDataTable />
      </Paper>
    </DashboardLayout>
  );
}