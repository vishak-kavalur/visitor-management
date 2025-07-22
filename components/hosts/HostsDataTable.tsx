'use client';

import React, { useState, useCallback } from 'react';
import { MUIDataTableColumn } from 'mui-datatables';
import { SelectChangeEvent } from '@mui/material/Select';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formSchemas, HostFormData, getErrorMessage } from '../../lib/validation/form-schemas';
import { FormTextField, FormSelectField } from '../ui/FormField';
import { notifications } from '../ui/Notifications';
import ProtectedDataTable from '../dashboard/ProtectedDataTable';
import { useAuth } from '../../lib/auth/client';

// Types for hosts data
interface Department {
  _id: string;
  name: string;
}

type HostRole = 'SuperAdmin' | 'Admin' | 'Host';

interface Host extends Record<string, unknown> {
  _id: string;
  email: string;
  fullName: string;
  departmentId: Department | null;
  role: HostRole;
  createdAt?: string;
  updatedAt?: string;
}

// Component
const HostsDataTable: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [currentHost, setCurrentHost] = useState<Host | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Define a custom schema for host form that extends the base host schema
  const hostFormSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
    fullName: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must not exceed 100 characters'),
    departmentId: z.string().min(1, 'Department is required'),
    role: z.enum(['Host', 'Admin', 'SuperAdmin'], { message: 'Please select a valid role' }),
  });

  // Type for form data
  type HostFormInputs = z.infer<typeof hostFormSchema>;
  
  // Setup form with validation
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<HostFormInputs>({
    resolver: zodResolver(hostFormSchema),
    defaultValues: {
      email: '',
      password: '',
      fullName: '',
      departmentId: '',
      role: 'Host' as HostRole,
    }
  });
  
  // Data for dropdowns
  const [departments, setDepartments] = useState<Department[]>([]);
  
  // Fetch departments for dropdown
  const fetchDepartments = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/departments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      
      const result = await response.json();
      setDepartments(result.data || []);
    } catch (err) {
      console.error('Error fetching departments:', err);
      setError('Failed to load departments. Please try again.');
    }
  }, []);

  // Fetch hosts data
  const fetchHosts = async () => {
    try {
      const response = await fetch('/api/admin/hosts');
      
      if (!response.ok) {
        throw new Error('Failed to fetch hosts');
      }
      
      const result = await response.json();
      return { data: result.data || [], total: result.pagination?.total || 0 };
    } catch (err) {
      console.error('Error fetching hosts:', err);
      throw err;
    }
  };

  // Handle view details
  const handleView = (host: Host) => {
    setCurrentHost(host);
    setMode('view');
    setDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (host: Host) => {
    setCurrentHost(host);
    reset({
      email: host.email,
      password: '', // Password is not returned from the API
      fullName: host.fullName,
      departmentId: host.departmentId?._id || '',
      role: host.role,
    });
    setMode('edit');
    fetchDepartments();
    setDialogOpen(true);
  };

  // Handle add new
  const handleAdd = () => {
    setCurrentHost(null);
    reset({
      email: '',
      password: '',
      fullName: '',
      departmentId: '',
      role: 'Host',
    });
    setMode('add');
    fetchDepartments();
    setDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (host: Host) => {
    // Only SuperAdmin can delete hosts
    if (!hasRole('SuperAdmin')) {
      setError('Only SuperAdmin can delete hosts');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete the host ${host.fullName}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/hosts/${host._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete host');
      }
      
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error deleting host:', err);
      setError('Failed to delete host. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: HostFormInputs) => {
    try {
      setLoading(true);
      setError(null);
      
      if (mode === 'add') {
        // Create new host
        const response = await fetch('/api/admin/hosts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create host');
        }
        
        notifications.success('Host created successfully');
      } else if (mode === 'edit' && currentHost) {
        // Update host - create a new object with only the fields we want to update
        const updateData = {
          fullName: data.fullName,
          role: data.role,
          departmentId: data.departmentId || null
        };
        
        // Only include password if it's provided
        if (data.password) {
          Object.assign(updateData, { password: data.password });
        }
        
        const response = await fetch(`/api/admin/hosts/${currentHost._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update host');
        }
        
        notifications.success('Host updated successfully');
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
      name: 'fullName',
      label: 'Name',
      options: {
        filter: true,
        sort: true,
      }
    },
    {
      name: 'email',
      label: 'Email',
      options: {
        filter: true,
        sort: true,
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
          return dataIndex && dataIndex.departmentId ? dataIndex.departmentId.name : 'N/A';
        }
      }
    },
    {
      name: 'role',
      label: 'Role',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          let color: 'warning' | 'success' | 'error' | 'info' | 'default' | 'primary' | 'secondary' = 'default';
          switch (value) {
            case 'SuperAdmin':
              color = 'error';
              break;
            case 'Admin':
              color = 'warning';
              break;
            case 'Host':
              color = 'info';
              break;
            default:
              color = 'default';
          }
          
          return <Chip label={value} color={color} size="small" />;
        }
      }
    },
  ];

  return (
    <>
      <ProtectedDataTable<Host>
        title="Hosts"
        columns={columns}
        fetchData={fetchHosts}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={hasRole('SuperAdmin') ? (host) => {
          try {
            handleDelete(host);
          } catch (error) {
            notifications.error('Failed to delete host');
          }
        } : undefined}
        onAdd={handleAdd}
        allowAdd={true}
        allowEdit={true}
        allowDelete={hasRole('SuperAdmin')}
        allowView={true}
        requiredRoleForAdd="Admin"
        requiredRoleForEdit="Admin"
        requiredRoleForDelete="SuperAdmin"
        requiredRoleForView="Admin"
      />

      {/* Dialog for View/Edit/Add */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          {mode === 'view' ? 'Host Details' : mode === 'edit' ? 'Edit Host' : 'Add New Host'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {mode === 'view' && currentHost ? (
              // View Mode
              <>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Name</Typography>
                  <Typography variant="body1">{currentHost.fullName}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Email</Typography>
                  <Typography variant="body1">{currentHost.email}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Department</Typography>
                  <Typography variant="body1">{currentHost.departmentId ? currentHost.departmentId.name : 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Role</Typography>
                  <Typography variant="body1">
                    <Chip 
                      label={currentHost.role} 
                      color={
                        currentHost.role === 'SuperAdmin' ? 'error' :
                        currentHost.role === 'Admin' ? 'warning' :
                        currentHost.role === 'Host' ? 'info' : 
                        'default' as 'warning' | 'success' | 'error' | 'info' | 'default' | 'primary' | 'secondary'
                      } 
                      size="small" 
                    />
                  </Typography>
                </Grid>
                {currentHost.createdAt && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Created</Typography>
                    <Typography variant="body1">
                      {new Date(currentHost.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {currentHost.updatedAt && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Last Updated</Typography>
                    <Typography variant="body1">
                      {new Date(currentHost.updatedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </>
            ) : (
              // Edit/Add Mode
              <>
                <Grid item xs={12} md={6}>
                  <FormTextField
                    name="fullName"
                    control={control}
                    label="Full Name"
                    required
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormTextField
                    name="email"
                    control={control}
                    label="Email"
                    type="email"
                    required
                    disabled={mode === 'edit' || isSubmitting} // Email shouldn't be changed after creation
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormTextField
                    name="password"
                    control={control}
                    label="Password"
                    type="password"
                    required={mode === 'add'}
                    helperText={mode === 'edit' ? "Leave blank to keep current password" : ""}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormSelectField
                    name="departmentId"
                    control={control}
                    label="Department"
                    options={departments.map((dept) => ({
                      value: dept._id,
                      label: dept.name
                    }))}
                    required
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormSelectField
                    name="role"
                    control={control}
                    label="Role"
                    options={[
                      { value: 'Host', label: 'Host' },
                      { value: 'Admin', label: 'Admin' },
                      ...(hasRole('SuperAdmin') ? [{ value: 'SuperAdmin', label: 'SuperAdmin' }] : [])
                    ]}
                    required
                    disabled={isSubmitting}
                  />
                </Grid>
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

export default HostsDataTable;