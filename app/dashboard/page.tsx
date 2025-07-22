'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import PeopleIcon from '@mui/icons-material/People';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DoneIcon from '@mui/icons-material/Done';
import PendingIcon from '@mui/icons-material/Pending';
import { format } from 'date-fns';

// Types for API responses
interface DashboardSummary {
  totalVisitors: number;
  activeVisits: number;
  completedVisits: number;
  pendingVisits: number;
}

interface RecentVisit {
  id: string;
  visitorName: string;
  purpose: string;
  hostName: string;
  checkInTime: string;
  status: string;
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DashboardSummary>({
    totalVisitors: 0,
    activeVisits: 0,
    completedVisits: 0,
    pendingVisits: 0,
  });
  const [recentVisits, setRecentVisits] = useState<RecentVisit[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch summary data
        const summaryResponse = await fetch('/api/dashboard/summary');
        if (!summaryResponse.ok) {
          throw new Error('Failed to fetch dashboard summary');
        }
        const summaryData = await summaryResponse.json();
        
        // Fetch recent visits
        const visitsResponse = await fetch('/api/dashboard/recent-visits');
        if (!visitsResponse.ok) {
          throw new Error('Failed to fetch recent visits');
        }
        const visitsData = await visitsResponse.json();
        
        setStats(summaryData.data);
        setRecentVisits(visitsData.data);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Format date for display
  const formatDateTime = (dateString: string) => {
    try {
      return format(new Date(dateString), 'hh:mm a');
    } catch (err) {
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <DashboardLayout>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <PeopleIcon sx={{ fontSize: 40, color: 'primary.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.totalVisitors}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Visitors
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <MeetingRoomIcon sx={{ fontSize: 40, color: 'info.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.activeVisits}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Active Visits
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <DoneIcon sx={{ fontSize: 40, color: 'success.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.completedVisits}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Visits
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
              <PendingIcon sx={{ fontSize: 40, color: 'warning.main', mr: 2 }} />
              <Box>
                <Typography variant="h5">{stats.pendingVisits}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Visits
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Visits */}
      <Typography variant="h5" gutterBottom>
        Recent Visits
      </Typography>
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="recent visits table">
            <TableHead>
              <TableRow>
                <TableCell>Visitor</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Host</TableCell>
                <TableCell>Check-In Time</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentVisits.map((visit) => (
                <TableRow key={visit.id} hover>
                  <TableCell>{visit.visitorName}</TableCell>
                  <TableCell>{visit.purpose}</TableCell>
                  <TableCell>{visit.hostName}</TableCell>
                  <TableCell>{formatDateTime(visit.checkInTime)}</TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 
                          visit.status === 'Checked In' ? 'success.main' :
                          visit.status === 'Checked Out' ? 'info.main' : 
                          'warning.main',
                        fontWeight: 'medium',
                      }}
                    >
                      {visit.status}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </DashboardLayout>
  );
}