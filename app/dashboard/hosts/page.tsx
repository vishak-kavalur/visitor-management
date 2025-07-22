'use client';

import { useEffect } from 'react';
import { Typography, Paper, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import HostsDataTable from '../../../components/hosts/HostsDataTable';
import { useAuth } from '../../../lib/auth/client';

export default function HostsPage() {
  const { user, hasRole, loading } = useAuth();
  const router = useRouter();
  
  // Check if user has Admin or SuperAdmin role
  useEffect(() => {
    if (!loading && user && !(hasRole('Admin') || hasRole('SuperAdmin'))) {
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

  // Render only if user has appropriate role
  if (!user || !(hasRole('Admin') || hasRole('SuperAdmin'))) {
    return (
      <DashboardLayout>
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Hosts Management
      </Typography>
      <Typography variant="body1" paragraph>
        Manage host accounts in the system. Only administrators can add, edit, or delete host information.
      </Typography>
      <Paper sx={{ p: 2 }}>
        <HostsDataTable />
      </Paper>
    </DashboardLayout>
  );
}