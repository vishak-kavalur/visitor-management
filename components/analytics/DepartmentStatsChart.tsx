'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

interface DepartmentDataPoint {
  _id: string;
  departmentId: string;
  departmentName: string;
  totalVisits: number;
  approved: number;
  rejected: number;
  checkedIn: number;
  checkedOut: number;
  pending: number;
  completionRate: number;
}

interface DepartmentStatsChartProps {
  data: DepartmentDataPoint[];
}

export const DepartmentStatsChart: React.FC<DepartmentStatsChartProps> = ({ data }) => {
  const theme = useTheme();

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No department data available
        </Typography>
      </Box>
    );
  }

  // Sort data by total visits (descending)
  const sortedData = [...data].sort((a, b) => b.totalVisits - a.totalVisits);

  // Limit to top 10 departments if there are more than 10
  const chartData = sortedData.slice(0, 10).map(dept => ({
    name: dept.departmentName,
    totalVisits: dept.totalVisits,
    checkedIn: dept.checkedIn,
    checkedOut: dept.checkedOut,
    pending: dept.pending,
    completionRate: parseFloat(dept.completionRate.toFixed(1))
  }));

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Department Visit Statistics {chartData.length < data.length ? `(Top ${chartData.length})` : ''}
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 20, bottom: 70 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45} 
            textAnchor="end" 
            height={70} 
            interval={0}
            tick={{ fontSize: 12 }}
          />
          <YAxis />
          <Tooltip
            formatter={(value: number, name: string) => {
              if (name === 'completionRate') {
                return [`${value}%`, 'Completion Rate'];
              }
              return [value, name.replace(/([A-Z])/g, ' $1').trim()];
            }}
          />
          <Legend />
          <Bar 
            dataKey="totalVisits" 
            name="Total Visits" 
            fill={theme.palette.primary.main} 
          />
          <Bar 
            dataKey="checkedIn" 
            name="Checked In" 
            fill={theme.palette.success.main} 
          />
          <Bar 
            dataKey="checkedOut" 
            name="Checked Out" 
            fill={theme.palette.info.main} 
          />
          <Bar 
            dataKey="pending" 
            name="Pending" 
            fill={theme.palette.warning.main} 
          />
        </BarChart>
      </ResponsiveContainer>
    </Box>
  );
};