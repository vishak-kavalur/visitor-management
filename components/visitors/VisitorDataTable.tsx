'use client';

import React, { useState } from 'react';
import MUIDataTable, { MUIDataTableOptions, MUIDataTableColumn } from 'mui-datatables';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Grid,
  Box,
  CircularProgress,
  Alert,
  TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchemas, VisitorFormData } from '../../lib/validation/form-schemas';
import { FormTextField } from '../ui/FormField';
import { notifications } from '../ui/Notifications';

// Mock data for visitors
const initialVisitors = [
  {
    id: 1,
    name: 'John Smith',
    email: 'john.smith@example.com',
    phone: '+1 (555) 123-4567',
    company: 'ABC Corporation',
    visitsCount: 5,
  },
  {
    id: 2,
    name: 'Maria Garcia',
    email: 'maria.garcia@example.com',
    phone: '+1 (555) 987-6543',
    company: 'XYZ Inc.',
    visitsCount: 3,
  },
  {
    id: 3,
    name: 'Robert Chen',
    email: 'robert.chen@example.com',
    phone: '+1 (555) 456-7890',
    company: 'Tech Solutions Ltd.',
    visitsCount: 8,
  },
  {
    id: 4,
    name: 'Emma Taylor',
    email: 'emma.taylor@example.com',
    phone: '+1 (555) 789-0123',
    company: 'Global Innovations',
    visitsCount: 2,
  },
  {
    id: 5,
    name: 'James Wilson',
    email: 'james.wilson@example.com',
    phone: '+1 (555) 234-5678',
    company: 'Creative Designs',
    visitsCount: 1,
  },
];

interface Visitor {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  visitsCount: number;
}

const VisitorDataTable: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'view' | 'edit' | 'add'>('view');
  const [selectedVisitorId, setSelectedVisitorId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Setup form with validation
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<VisitorFormData>({
    resolver: zodResolver(formSchemas.visitor),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
    }
  });

  // Get current visitor from ID
  const currentVisitor = selectedVisitorId
    ? visitors.find(v => v.id === selectedVisitorId) || null
    : null;

  const handleOpen = (visitor: Visitor | null, mode: 'view' | 'edit' | 'add') => {
    setError(null);
    setMode(mode);
    
    if (visitor) {
      setSelectedVisitorId(visitor.id);
      
      if (mode === 'edit' || mode === 'view') {
        // Reset form with visitor data
        reset({
          name: visitor.name,
          email: visitor.email,
          phone: visitor.phone,
          company: visitor.company,
        });
      }
    } else {
      setSelectedVisitorId(null);
      reset({
        name: '',
        email: '',
        phone: '',
        company: '',
      });
    }
    
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setError(null);
    setSelectedVisitorId(null);
  };

  const onSubmit = async (data: VisitorFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (mode === 'add') {
        // Add new visitor with a unique ID
        const newId = Math.max(...visitors.map(v => v.id), 0) + 1;
        const newVisitor: Visitor = {
          id: newId,
          name: data.name,
          email: data.email,
          phone: data.phone,
          company: data.company,
          visitsCount: 0,
        };
        
        setVisitors([...visitors, newVisitor]);
        notifications.success('Visitor added successfully');
      } else if (mode === 'edit' && selectedVisitorId) {
        // Update existing visitor
        setVisitors(visitors.map(v =>
          v.id === selectedVisitorId ? {
            ...v,
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
          } : v
        ));
        notifications.success('Visitor updated successfully');
      }

      handleClose();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: number) => {
    try {
      setVisitors(visitors.filter(visitor => visitor.id !== id));
      notifications.success('Visitor deleted successfully');
    } catch (err) {
      notifications.error('Failed to delete visitor');
    }
  };

  const columns: MUIDataTableColumn[] = [
    {
      name: 'id',
      label: 'ID',
      options: {
        filter: false,
        sort: true,
      }
    },
    {
      name: 'name',
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
      name: 'phone',
      label: 'Phone',
      options: {
        filter: false,
        sort: false,
      }
    },
    {
      name: 'company',
      label: 'Company',
      options: {
        filter: true,
        sort: true,
      }
    },
    {
      name: 'visitsCount',
      label: 'Visits',
      options: {
        filter: false,
        sort: true,
      }
    },
    {
      name: 'actions',
      label: 'Actions',
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta) => {
          const visitorId = tableMeta.rowData[0];
          const visitor = visitors.find(v => v.id === visitorId);
          
          return (
            <Box>
              <IconButton
                size="small"
                onClick={() => visitor && handleOpen(visitor, 'view')}
              >
                <VisibilityIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => visitor && handleOpen(visitor, 'edit')}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleDelete(visitorId)}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
          );
        }
      }
    },
  ];

  const options: MUIDataTableOptions = {
    filterType: 'checkbox',
    responsive: 'standard',
    selectableRows: 'none',
    print: false,
    download: true,
    viewColumns: true,
    filter: true,
    customToolbar: () => {
      return (
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => handleOpen({
            id: 0,
            name: '',
            email: '',
            phone: '',
            company: '',
            visitsCount: 0,
          }, 'add')}
          sx={{ m: 1 }}
        >
          Add Visitor
        </Button>
      );
    },
  };

  return (
    <>
      <MUIDataTable
        title="Visitors"
        data={visitors}
        columns={columns}
        options={options}
      />

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>
          {mode === 'view' ? 'Visitor Details' : mode === 'edit' ? 'Edit Visitor' : 'Add Visitor'}
        </DialogTitle>
        
        <form onSubmit={mode !== 'view' ? handleSubmit(onSubmit) : undefined}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                {mode === 'view' ? (
                  <FormTextField
                    name="name"
                    control={control}
                    label="Name"
                    disabled={true}
                    fullWidth
                  />
                ) : (
                  <FormTextField
                    name="name"
                    control={control}
                    label="Name"
                    disabled={isSubmitting}
                    required
                    fullWidth
                  />
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                {mode === 'view' ? (
                  <FormTextField
                    name="email"
                    control={control}
                    label="Email"
                    disabled={true}
                    fullWidth
                  />
                ) : (
                  <FormTextField
                    name="email"
                    control={control}
                    label="Email"
                    disabled={isSubmitting}
                    required
                    fullWidth
                  />
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                {mode === 'view' ? (
                  <FormTextField
                    name="phone"
                    control={control}
                    label="Phone"
                    disabled={true}
                    fullWidth
                  />
                ) : (
                  <FormTextField
                    name="phone"
                    control={control}
                    label="Phone"
                    disabled={isSubmitting}
                    required
                    fullWidth
                  />
                )}
              </Grid>
              
              <Grid item xs={12} md={6}>
                {mode === 'view' ? (
                  <FormTextField
                    name="company"
                    control={control}
                    label="Company"
                    disabled={true}
                    fullWidth
                  />
                ) : (
                  <FormTextField
                    name="company"
                    control={control}
                    label="Company"
                    disabled={isSubmitting}
                    required
                    fullWidth
                  />
                )}
              </Grid>
              
              {mode === 'view' && currentVisitor && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Total Visits"
                    value={currentVisitor?.visitsCount.toString()}
                    disabled={true}
                    margin="normal"
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          
          <DialogActions>
            <Button onClick={handleClose} color="secondary">
              {mode === 'view' ? 'Close' : 'Cancel'}
            </Button>
            
            {mode !== 'view' && (
              <Button
                type="submit"
                color="primary"
                variant="contained"
                disabled={isSubmitting}
              >
                {isSubmitting ? <CircularProgress size={24} /> : 'Save'}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default VisitorDataTable;