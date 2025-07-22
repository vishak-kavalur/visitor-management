'use client';

import React, { useState } from 'react';
import { MUIDataTableColumn } from 'mui-datatables';
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  Box,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { formSchemas, DepartmentFormData } from '../../lib/validation/form-schemas';
import { FormTextField } from '../ui/FormField';
import { notifications } from '../ui/Notifications';
import ProtectedDataTable from '../dashboard/ProtectedDataTable';
import { useAuth } from '../../lib/auth/client';

// Types for departments data
interface Department extends Record<string, unknown> {
  _id: string;
  name: string;
  description?: string;
  floor?: string;
  building?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Component
const DepartmentsDataTable: React.FC = () => {
  const { user, hasRole } = useAuth();
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Set up form with validation
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<DepartmentFormData>({
    resolver: zodResolver(formSchemas.department),
    defaultValues: {
      name: '',
      description: '',
      floor: '',
      building: '',
    }
  });
  
  // Fetch departments data
  const fetchDepartments = async () => {
    try {
      const response = await fetch('/api/admin/departments');
      
      if (!response.ok) {
        throw new Error('Failed to fetch departments');
      }
      
      const result = await response.json();
      return { data: result.data || [], total: result.pagination?.total || 0 };
    } catch (err) {
      console.error('Error fetching departments:', err);
      throw err;
    }
  };

  // Handle view details
  const handleView = (department: Department) => {
    setCurrentDepartment(department);
    setMode('view');
    setDialogOpen(true);
  };

  // Handle edit
  const handleEdit = (department: Department) => {
    setCurrentDepartment(department);
    reset({
      name: department.name,
      description: department.description as string || '',
      floor: department.floor as string || '',
      building: department.building as string || '',
    });
    setMode('edit');
    setDialogOpen(true);
  };

  // Handle add new
  const handleAdd = () => {
    setCurrentDepartment(null);
    reset({
      name: '',
      description: '',
      floor: '',
      building: '',
    });
    setMode('add');
    setDialogOpen(true);
  };

  // Handle delete
  const handleDelete = async (department: Department) => {
    // Only SuperAdmin can delete departments
    if (!hasRole('SuperAdmin')) {
      setError('Only SuperAdmin can delete departments');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete the department "${department.name}"?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/departments/${department._id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete department');
      }
      
      // Refresh data
      window.location.reload();
    } catch (err) {
      console.error('Error deleting department:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete department. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const onSubmit = async (data: DepartmentFormData) => {
    try {
      setLoading(true);
      setError(null);
      
      if (mode === 'add') {
        // Create new department
        const response = await fetch('/api/admin/departments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to create department');
        }
        
        notifications.success('Department created successfully');
      } else if (mode === 'edit' && currentDepartment) {
        // Update department
        const response = await fetch(`/api/admin/departments/${currentDepartment._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to update department');
        }
        
        notifications.success('Department updated successfully');
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
      name: 'name',
      label: 'Department Name',
      options: {
        filter: true,
        sort: true,
      }
    },
    {
      name: 'description',
      label: 'Description',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return value || 'N/A';
        }
      }
    },
    {
      name: 'floor',
      label: 'Floor',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return value || 'N/A';
        }
      }
    },
    {
      name: 'building',
      label: 'Building',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return value || 'N/A';
        }
      }
    },
    {
      name: 'createdAt',
      label: 'Created Date',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return value ? new Date(value).toLocaleDateString() : 'N/A';
        }
      }
    },
    {
      name: 'updatedAt',
      label: 'Last Updated',
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => {
          return value ? new Date(value).toLocaleDateString() : 'N/A';
        }
      }
    },
  ];

  return (
    <>
      <ProtectedDataTable<Department>
        title="Departments"
        columns={columns}
        fetchData={fetchDepartments}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(department) => {
          try {
            handleDelete(department);
          } catch (error) {
            notifications.error('Failed to delete department');
          }
        }}
        onAdd={handleAdd}
        allowAdd={true}
        allowEdit={true}
        allowDelete={true}
        allowView={true}
        requiredRoleForAdd="SuperAdmin"
        requiredRoleForEdit="SuperAdmin"
        requiredRoleForDelete="SuperAdmin"
        requiredRoleForView="SuperAdmin"
      />

      {/* Dialog for View/Edit/Add */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {mode === 'view' ? 'Department Details' : mode === 'edit' ? 'Edit Department' : 'Add New Department'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {mode === 'view' && currentDepartment ? (
              // View Mode
              <>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Department Name</Typography>
                  <Typography variant="body1">{currentDepartment.name}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle2">Description</Typography>
                  <Typography variant="body1">{currentDepartment.description || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Floor</Typography>
                  <Typography variant="body1">{currentDepartment.floor || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2">Building</Typography>
                  <Typography variant="body1">{currentDepartment.building || 'N/A'}</Typography>
                </Grid>
                {currentDepartment.createdAt && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Created</Typography>
                    <Typography variant="body1">
                      {new Date(currentDepartment.createdAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
                {currentDepartment.updatedAt && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2">Last Updated</Typography>
                    <Typography variant="body1">
                      {new Date(currentDepartment.updatedAt).toLocaleString()}
                    </Typography>
                  </Grid>
                )}
              </>
            ) : (
              // Edit/Add Mode
              <>
                <Grid item xs={12}>
                  <FormTextField
                    name="name"
                    control={control}
                    label="Department Name"
                    required
                    disabled={isSubmitting}
                    autoFocus
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormTextField
                    name="description"
                    control={control}
                    label="Description"
                    multiline
                    rows={3}
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormTextField
                    name="floor"
                    control={control}
                    label="Floor"
                    disabled={isSubmitting}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormTextField
                    name="building"
                    control={control}
                    label="Building"
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

export default DepartmentsDataTable;