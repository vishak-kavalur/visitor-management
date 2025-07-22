'use client';

import { Box, Typography, Paper } from '@mui/material';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import VisitsDataTable from '../../../components/visits/VisitsDataTable';

export default function VisitsPage() {
  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Visits Management
      </Typography>
      <Typography variant="body1" paragraph>
        View, add, edit, and delete visit records in the system. Track visitor check-ins, status updates, and related information.
      </Typography>
      <Paper sx={{ p: 2 }}>
        <VisitsDataTable />
      </Paper>
    </DashboardLayout>
  );
}