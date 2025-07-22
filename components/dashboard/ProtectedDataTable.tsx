'use client';

import React, { useState, useEffect } from 'react';
import MUIDataTable, { MUIDataTableOptions, MUIDataTableColumn } from 'mui-datatables';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useAuth } from '../../lib/auth/client';

export interface ProtectedDataTableProps<T> {
  title: string;
  columns: MUIDataTableColumn[];
  fetchData: () => Promise<{ data: T[]; total: number }>;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onAdd?: () => void;
  allowAdd?: boolean;
  allowEdit?: boolean;
  allowDelete?: boolean;
  allowView?: boolean;
  requiredRoleForAdd?: 'Host' | 'Admin' | 'SuperAdmin';
  requiredRoleForEdit?: 'Host' | 'Admin' | 'SuperAdmin';
  requiredRoleForDelete?: 'Host' | 'Admin' | 'SuperAdmin';
  requiredRoleForView?: 'Host' | 'Admin' | 'SuperAdmin';
  idField?: string;
  refreshInterval?: number; // in milliseconds
}

function ProtectedDataTable<T extends Record<string, unknown>>({
  title,
  columns,
  fetchData,
  onView,
  onEdit,
  onDelete,
  onAdd,
  allowAdd = true,
  allowEdit = true,
  allowDelete = true,
  allowView = true,
  requiredRoleForAdd = 'Host',
  requiredRoleForEdit = 'Host',
  requiredRoleForDelete = 'SuperAdmin',
  requiredRoleForView = 'Host',
  idField = '_id',
  refreshInterval = 0,
}: ProtectedDataTableProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const { user, hasRole } = useAuth();

  // Function to load data
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetchData();
      setData(response.data);
      setTotalCount(response.total);
    } catch (err) {
      setError('Failed to load data. Please try again later.');
      console.error('Error loading data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Set up refresh interval if specified
  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(loadData, refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval]);

  // Add actions column if any action is allowed
  const columnsWithActions = [...columns];
  
  if (allowView || allowEdit || allowDelete) {
    columnsWithActions.push({
      name: 'actions',
      label: 'Actions',
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta) => {
          const rowData = tableMeta.rowData;
          const rowIndex = tableMeta.rowIndex;
          const item = data[rowIndex];
          
          return (
            <Box>
              {allowView && hasRole(requiredRoleForView) && onView && (
                <IconButton
                  size="small"
                  onClick={() => onView(item)}
                  title="View Details"
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              )}
              
              {allowEdit && hasRole(requiredRoleForEdit) && onEdit && (
                <IconButton
                  size="small"
                  onClick={() => onEdit(item)}
                  title="Edit"
                >
                  <EditIcon fontSize="small" />
                </IconButton>
              )}
              
              {allowDelete && hasRole(requiredRoleForDelete) && onDelete && (
                <IconButton
                  size="small"
                  onClick={() => onDelete(item)}
                  title="Delete"
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              )}
            </Box>
          );
        }
      }
    });
  }

  const options: MUIDataTableOptions = {
    filterType: 'checkbox',
    responsive: 'standard',
    selectableRows: 'none',
    print: false,
    download: true,
    viewColumns: true,
    filter: true,
    serverSide: false, // Can be set to true for server-side pagination
    count: totalCount,
    onTableChange: (action, tableState) => {
      // Can be implemented for server-side pagination
    },
    customToolbar: () => {
      if (allowAdd && hasRole(requiredRoleForAdd) && onAdd) {
        return (
          <Button 
            variant="contained" 
            color="primary"
            onClick={onAdd}
            sx={{ m: 1 }}
          >
            Add {title.endsWith('s') ? title.slice(0, -1) : title}
          </Button>
        );
      }
      return null;
    },
  };

  if (isLoading && data.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      <MUIDataTable
        title={title}
        data={data}
        columns={columnsWithActions}
        options={options}
      />
    </>
  );
}

export default ProtectedDataTable;