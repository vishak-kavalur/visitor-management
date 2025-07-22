'use client';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Alert, 
  CircularProgress,
  Tabs,
  Tab,
  Button,
  Stack,
  Chip,
  Card,
  CardContent,
  CardActions,
  Divider,
  Grid
} from '@mui/material';
import { format } from 'date-fns';
import { useAuth } from '../../../lib/auth/client';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import BusinessIcon from '@mui/icons-material/Business';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NoteIcon from '@mui/icons-material/Note';

// Types for the pending visits
interface PendingVisit {
  id: string;
  visitorName: string;
  visitorEmail: string;
  visitorPhone: string;
  purpose: string;
  hostName: string;
  hostId: string;
  departmentName: string;
  departmentId: string;
  submissionTime: string;
}

export default function PendingApprovalsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visits, setVisits] = useState<PendingVisit[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const { user, hasRole } = useAuth();

  // Function to format dates for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP p'); // e.g., "Apr 29, 2023, 7:30 PM"
    } catch (err) {
      return 'Invalid date';
    }
  };

  // Fetch pending approvals
  useEffect(() => {
    const fetchPendingApprovals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch('/api/dashboard/pending-approvals');
        if (!response.ok) {
          throw new Error('Failed to fetch pending approvals');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to fetch pending approvals');
        }
        
        setVisits(data.data);
      } catch (err) {
        console.error('Error fetching pending approvals:', err);
        setError('Failed to load pending approvals. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPendingApprovals();
  }, []);

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle approval action
  const handleApprove = async (visitId: string) => {
    try {
      setActionLoading(visitId);
      setSuccessMessage(null);
      setError(null);
      
      const response = await fetch(`/api/visits/${visitId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to approve visit');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to approve visit');
      }
      
      // Remove the approved visit from the list
      setVisits(visits.filter(visit => visit.id !== visitId));
      setSuccessMessage('Visit approved successfully');
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error approving visit:', err);
      setError('Failed to approve visit. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Handle rejection action
  const handleReject = async (visitId: string) => {
    try {
      setActionLoading(visitId);
      setSuccessMessage(null);
      setError(null);
      
      const response = await fetch(`/api/visits/${visitId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to reject visit');
      }
      
      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to reject visit');
      }
      
      // Remove the rejected visit from the list
      setVisits(visits.filter(visit => visit.id !== visitId));
      setSuccessMessage('Visit rejected successfully');
      
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error rejecting visit:', err);
      setError('Failed to reject visit. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter visits for different tabs
  const getFilteredVisits = () => {
    if (tabValue === 0) {
      return visits; // All pending visits
    } else if (tabValue === 1 && user?.id) {
      return visits.filter(visit => visit.hostId === user.id); // My approvals
    }
    return [];
  };

  const filteredVisits = getFilteredVisits();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <Typography variant="h4" gutterBottom>
        Pending Approvals
      </Typography>
      
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {successMessage}
        </Alert>
      )}
      
      {/* Tabs for filtering */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Pending Approvals" />
          {hasRole('Host') && <Tab label="My Approvals" />}
        </Tabs>
      </Box>
      
      {filteredVisits.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No pending approvals found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            All visit requests have been processed or there are no pending requests.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredVisits.map((visit) => (
            <Grid item xs={12} md={6} lg={4} key={visit.id}>
              <Card elevation={2}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" component="div">
                      {visit.visitorName}
                    </Typography>
                    <Chip label="Pending" color="warning" size="small" />
                  </Box>
                  
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon color="primary" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Host:</strong> {visit.hostName}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon color="primary" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Department:</strong> {visit.departmentName}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NoteIcon color="primary" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Purpose:</strong> {visit.purpose}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon color="primary" fontSize="small" />
                      <Typography variant="body2">
                        <strong>Requested:</strong> {formatDate(visit.submissionTime)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
                
                <Divider />
                
                <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
                  <Button 
                    startIcon={<CancelIcon />} 
                    color="error"
                    onClick={() => handleReject(visit.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === visit.id ? <CircularProgress size={24} /> : 'Reject'}
                  </Button>
                  <Button 
                    startIcon={<CheckCircleIcon />} 
                    variant="contained" 
                    color="success"
                    onClick={() => handleApprove(visit.id)}
                    disabled={!!actionLoading}
                  >
                    {actionLoading === visit.id ? <CircularProgress size={24} /> : 'Approve'}
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}