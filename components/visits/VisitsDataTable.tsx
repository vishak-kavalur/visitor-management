'use client';

import React, { useState, useCallback } from 'react';
import { MUIDataTableColumn } from 'mui-datatables';
import { z } from 'zod';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Grid,
  MenuItem,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Box,
} from '@mui/material';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchemas, VisitFormData } from '../../lib/validation/form-schemas';
import { FormTextField, FormSelectField } from '../ui/FormField';
import { notifications } from '../ui/Notifications';
import ProtectedDataTable from '../dashboard/ProtectedDataTable';
import { useAuth } from '../../lib/auth/client';

// Types for visits data
interface Visitor {
  _id: string;
  fullName: string;
  aadhaarNumber: string;
  imageBase64: string;
}

interface Host {
  _id: string;
  fullName: string;
  email: string;
  role: string;
}

interface Department {
  _id: string;
  name: string;
}

interface Approval {
  approvedBy: string;
  timestamp: string;
}

interface Visit extends Record<string, unknown> {
  _id: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'CheckedIn' | 'CheckedOut';
  visitorId: Visitor;
  hostId: Host;
  departmentId: Department;
  purposeOfVisit: string;
  submissionTimestamp: string;
  approval?: Approval;
  checkInTimestamp?: string;
  checkOutTimestamp?: string;
}

// Component
const VisitsDataTable: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [currentVisit, setCurrentVisit] = useState<Visit | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Extended schema type
  type VisitStatus = 'Pending' | 'Approved' | 'Rejected' | 'CheckedIn' | 'CheckedOut';
  
  // Create an extended schema that includes our additional fields
  const extendedVisitSchema = formSchemas.visit.extend({
    departmentId: z.string().min(1, 'Department is required'),
    status: z.enum(['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut'])
  });
  
  // Type for our extended form data
  type ExtendedVisitFormData = z.infer<typeof extendedVisitSchema>;
  
  // Setup form with validation
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ExtendedVisitFormData>({
    resolver: zodResolver(extendedVisitSchema),
    defaultValues: {
      visitorId: '',
      hostId: '',
      purpose: '',
      scheduledTime: undefined,
      notes: '',
      departmentId: '',
      status: 'Pending'
    }
  });
  
  // Data for dropdowns
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [hosts, setHosts] = useState<Host[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Fetch visitors, hosts, and departments for dropdowns
  const fetchFormOptions = useCallback(async () => {
    try {
      // In a real implementation, we'd fetch these from API endpoints
      const [visitorsRes, hostsRes, departmentsRes] = await Promise.all([
        fetch('/api/visitors'),
        fetch('/api/admin/hosts'),
        fetch('/api/admin/departments')
      ]);
      
      if (!visitorsRes.ok || !hostsRes.ok || !departmentsRes.ok) {
        throw new Error('Failed to fetch options data');
      }
      
      const visitorsData = await visitorsRes.json();
      const hostsData = await hostsRes.json();
      const departmentsData = await departmentsRes.json();
      
      setVisitors(visitorsData.data || []);
      setHosts(hostsData.data || []);
      setDepartments(departmentsData.data || []);
    } catch (err) {
      console.error('Error fetching form options:', err);
      setError('Failed to load form data. Please try again.');
    }
  }, []);

  // Fetch visits data
  const fetchVisits = async () => {
    try {
      const response = await fetch('/api/visits');
      
      if (!response.ok) {
        throw new Error('Failed to fetch visits');
      }
      
      const result = await response.json();
      return { data: result.data || [], total: result.pagination?.total || 0 };
    } catch (err) {
      console.error('Error fetching visits:', err);
      throw err;
    }
  };

  // Handle view details
  const handleView = (visit: Visit) => {
    setCurrentVisit(visit);
    setMode('view');
    setDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (visit: Visit) => {
    setCurrentVisit(visit);
    reset({
      visitorId: visit.visitorId._id,
      hostId: visit.hostId._id,
      departmentId: visit.departmentId._id,
      purpose: visit.purposeOfVisit,
      status: visit.status,
      notes: visit.notes as string || '',
      scheduledTime: visit.scheduledTime ? new Date(visit.scheduledTime as string) : undefined
    });
    setMode('edit');
    fetchFormOptions();
    setDialogOpen(true);
  };

  // Handle add new
  const handleAdd = () => {
    setCurrentVisit(null);
    reset({
      visitorId: '',
      hostId: '',
      departmentId: '',
      purpose: '',
      scheduledTime: undefined,
      notes: '',
      status: 'Pending'
    });
    setMode('add');
    fetchFormOptions();
    setDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (visit: Visit) => {
    if (!confirm(`Are you sure you want to delete the visit for ${visit.visitorId.fullName}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/visits/${visit._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete visit');
      }
      
      notifications.success('Visit deleted successfully');
      
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error deleting visit:', err);
      setError('Failed to delete visit. Please try again.');
      notifications.error('Failed to delete visit');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: ExtendedVisitFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (mode === 'add') {
        // Create new visit
        const response = await fetch('/api/visits', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visitorId: data.visitorId,
            hostId: data.hostId,
            departmentId: data.departmentId,
            purposeOfVisit: data.purpose, // Map from form field 'purpose' to API field 'purposeOfVisit'
            scheduledTime: data.scheduledTime,
            notes: data.notes
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create visit');
        }
        
        notifications.success('Visit created successfully');
      } else if (mode === 'edit') {
        // Update visit status only (more complete editing would require additional API)
        const response = await fetch(`/api/visits/${currentVisit?._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: data.status,
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update visit');
        }
        
        notifications.success('Visit updated successfully');
      }
      
      // Close dialog and refresh data
      setDialogOpen(false);
      window.location.reload();
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      notifications.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Define table columns
  const columns: MUIDataTableColumn[] = [
    {
      name: '_id',
      label: 'ID',
      options: {
        display: 'excluded',
        filter: false,
      }
    },
    {
      name: 'visitorName',
      label: 'Visitor',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const rowIndex = tableMeta.rowIndex;
          const dataIndex = tableMeta.tableData[rowIndex];
          return dataIndex ? dataIndex.visitorId?.fullName || 'N/A' : 'N/A';
        }
      }
    },
    {
      name: 'hostName',
      label: 'Host',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const rowIndex = tableMeta.rowIndex;
          const dataIndex = tableMeta.tableData[rowIndex];
          return dataIndex ? dataIndex.hostId?.fullName || 'N/A' : 'N/A';
        }
      }
    },
    {
      name: 'departmentName',
      label: 'Department',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => {
          const rowIndex = tableMeta.rowIndex;
          const dataIndex = tableMeta.tableData[rowIndex];
          return dataIndex ? dataIndex.departmentId?.name || 'N/A' : 'N/A';
        }
      }
    },
    {
      name: 'purposeOfVisit',
      label: 'Purpose',
      options: {
        filter: true,
        sort: true,
      }
    },
    {
      name: 'status',
      label: 'Status',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          let color: 'warning' | 'success' | 'error' | 'info' | 'default' | 'primary' | 'secondary' = 'default';
          switch (value) {
            case 'Pending':
              color = 'warning';
              break;
            case 'Approved':
              color = 'success';
              break;
            case 'Rejected':
              color = 'error';
              break;
            case 'CheckedIn':
              color = 'info';
              break;
            case 'CheckedOut':
              color = 'default';
              break;
            default:
              color = 'default';
          }
          
          return <Chip label={value} color={color} size="small" />;
        }
      }
    },
    {
      name: 'submissionTimestamp',
      label: 'Submission Date',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return value ? format(new Date(value), 'MMM dd, yyyy HH:mm') : 'N/A';
        }
      }
    },
  ];

  return (
    <>
      <ProtectedDataTable<Visit>
        title="Visits"
        columns={columns}
        fetchData={fetchVisits}
        onView={handleView}
        onEdit={hasRole('Admin') ? handleEdit : undefined}
        onDelete={hasRole('SuperAdmin') ? (visit) => {
          try {
            handleDelete(visit);
          } catch (error) {
            notifications.error('Failed to delete visit');
          }
        } : undefined}
        onAdd={handleAdd}
        allowAdd={true}
        allowEdit={hasRole('Admin')}
        allowDelete={hasRole('SuperAdmin')}
        allowView={true}
        requiredRoleForAdd="Host"
        requiredRoleForEdit="Admin"
        requiredRoleForDelete="SuperAdmin"
        requiredRoleForView="Host"
      />

      {/* Dialog for View/Edit/Add */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {mode === 'view' ? 'Visit Details' : mode === 'edit' ? 'Edit Visit' : 'Add New Visit'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {mode === 'view' && currentVisit ? (
              // View Mode
              <>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Visitor</Typography>
                  <Typography variant="body1">{currentVisit.visitorId.fullName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Host</Typography>
                  <Typography variant="body1">{currentVisit.hostId.fullName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Department</Typography>
                  <Typography variant="body1">{currentVisit.departmentId.name}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Purpose of Visit</Typography>
                  <Typography variant="body1">{currentVisit.purposeOfVisit}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Status</Typography>
                  <Typography variant="body1">
                    <Chip
                      label={currentVisit.status}
                      color={
                        currentVisit.status === 'Pending' ? 'warning' :
                        currentVisit.status === 'Approved' ? 'success' :
                        currentVisit.status === 'Rejected' ? 'error' :
                        currentVisit.status === 'CheckedIn' ? 'info' :
                        'default' as 'warning' | 'success' | 'error' | 'info' | 'default' | 'primary' | 'secondary'
                      }
                      size="small"
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Submission Date</Typography>
                  <Typography variant="body1">
                    {format(new Date(currentVisit.submissionTimestamp), 'MMM dd, yyyy HH:mm')}
                  </Typography>
                </Grid>
                {currentVisit.approval && (
                  <>
                    <Grid item xs={12} md={6}>
                      <Typography variant="subtitle2">Approval Date</Typography>
                      <Typography variant="body1">
                        {format(new Date(currentVisit.approval.timestamp), 'MMM dd, yyyy HH:mm')}
                      </Typography>
                    </Grid>
                  </>
                )}
                {currentVisit.checkInTimestamp && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Check-in Time</Typography>
                    <Typography variant="body1">
                      {format(new Date(currentVisit.checkInTimestamp), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Grid>
                )}
                {currentVisit.checkOutTimestamp && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Check-out Time</Typography>
                    <Typography variant="body1">
                      {format(new Date(currentVisit.checkOutTimestamp), 'MMM dd, yyyy HH:mm')}
                    </Typography>
                  </Grid>
                )}
              </>
            ) : (
              // Edit/Add Mode
              <>
                <Grid item xs={12} md={6}>
                  <FormSelectField
                    name="visitorId"
                    control={control}
                    label="Visitor"
                    options={visitors.map((visitor) => ({
                      value: visitor._id,
                      label: visitor.fullName
                    }))}
                    disabled={mode === 'edit' || isSubmitting}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormSelectField
                    name="hostId"
                    control={control}
                    label="Host"
                    options={hosts.map((host) => ({
                      value: host._id,
                      label: host.fullName
                    }))}
                    disabled={mode === 'edit' || isSubmitting}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormSelectField
                    name="departmentId"
                    control={control}
                    label="Department"
                    options={departments.map((department) => ({
                      value: department._id,
                      label: department.name
                    }))}
                    disabled={mode === 'edit' || isSubmitting}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormTextField
                    name="purpose"
                    control={control}
                    label="Purpose of Visit"
                    disabled={mode === 'edit' || isSubmitting}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormTextField
                    name="notes"
                    control={control}
                    label="Additional Notes"
                    disabled={isSubmitting}
                    multiline
                    rows={3}
                  />
                </Grid>
                {mode === 'add' && (
                  <Grid item xs={12} md={6}>
                    <FormTextField
                      name="scheduledTime"
                      control={control}
                      label="Scheduled Time"
                      type="datetime-local"
                      disabled={isSubmitting}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                )}
                {mode === 'edit' && hasRole('Admin') && (
                  <Grid item xs={12} md={6}>
                    <FormSelectField
                      name="status"
                      control={control}
                      label="Status"
                      options={[
                        { value: 'Pending', label: 'Pending' },
                        { value: 'Approved', label: 'Approved' },
                        { value: 'Rejected', label: 'Rejected' },
                        { value: 'CheckedIn', label: 'Checked In' },
                        { value: 'CheckedOut', label: 'Checked Out' }
                      ]}
                      disabled={isSubmitting}
                      required
                    />
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} color="secondary">
            {mode === 'view' ? 'Close' : 'Cancel'}
          </Button>
          
          {mode !== 'view' && (
            <Button
              onClick={handleSubmit(onSubmit)}
              color="primary"
              variant="contained"
              disabled={loading || isSubmitting}
            >
              {loading || isSubmitting ? <CircularProgress size={24} /> : 'Save'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default VisitsDataTable;