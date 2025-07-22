'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

interface VisitDataPoint {
  date: string;
  totalVisits: number;
  approved: number;
  rejected: number;
  checkedIn: number;
  checkedOut: number;
  pending: number;
  completionRate: number;
}

interface VisitStatusChartProps {
  data: VisitDataPoint[];
}

export const VisitStatusChart: React.FC<VisitStatusChartProps> = ({ data }) => {
  const theme = useTheme();

  // Format the date for display
  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      return format(date, 'MMM d');
    } catch (error) {
      console.error('Date parsing error:', error);
      return dateStr;
    }
  };

  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No visit status data available
        </Typography>
      </Box>
    );
  }

  // Process data for chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: formatDate(item.date)
  }));

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Visit Status Distribution Over Time
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          stackOffset="sign"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="formattedDate" />
          <YAxis />
          <Tooltip 
            formatter={(value: number, name: string) => {
              if (name === 'completionRate') {
                return [`${value.toFixed(1)}%`, 'Completion Rate'];
              }
              return [value, name.replace(/([A-Z])/g, ' $1').trim()];
            }}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Bar 
            dataKey="approved" 
            name="Approved" 
            stackId="status" 
            fill={theme.palette.success.light} 
            barSize={20}
          />
          <Bar 
            dataKey="checkedIn" 
            name="Checked In" 
            stackId="status" 
            fill={theme.palette.success.main} 
            barSize={20}
          />
          <Bar 
            dataKey="checkedOut" 
            name="Checked Out" 
            stackId="status" 
            fill={theme.palette.info.main} 
            barSize={20}
          />
          <Bar 
            dataKey="pending" 
            name="Pending" 
            stackId="status" 
            fill={theme.palette.warning.main} 
            barSize={20}
          />
          <Bar 
            dataKey="rejected" 
            name="Rejected" 
            stackId="status" 
            fill={theme.palette.error.main} 
            barSize={20}
          />
          <Line 
            type="monotone" 
            dataKey="completionRate" 
            name="Completion Rate" 
            stroke={theme.palette.secondary.main}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            yAxisId={1}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </Box>
  );
};