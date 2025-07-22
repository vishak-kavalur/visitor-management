'use client';

import { Box, Typography, Paper } from '@mui/material';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import VisitorDataTable from '../../../components/visitors/VisitorDataTable';

export default function VisitorsPage() {
  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Visitors Management
      </Typography>
      <Typography variant="body1" paragraph>
        View, add, edit, and delete visitors in the system. Use the search and filter options to find specific visitors.
      </Typography>
      <Paper sx={{ p: 2 }}>
        <VisitorDataTable />
      </Paper>
    </DashboardLayout>
  );
}