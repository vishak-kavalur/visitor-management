'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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

interface VisitTrendsChartProps {
  data: VisitDataPoint[];
  period: string;
}

export const VisitTrendsChart: React.FC<VisitTrendsChartProps> = ({ data, period }) => {
  const theme = useTheme();

  // Format the date based on the period
  const formatDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      switch (period) {
        case 'weekly':
          return format(date, 'MMM do');
        case 'monthly':
          return format(date, 'MMM yyyy');
        case 'daily':
        default:
          return format(date, 'MMM d');
      }
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
          No visit data available for the selected period
        </Typography>
      </Box>
    );
  }

  const chartData = data.map(item => ({
    ...item,
    formattedDate: formatDate(item.date)
  }));

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Visit Trends
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="totalVisits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="checkedIn" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.success.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.success.main} stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="checkedOut" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={theme.palette.info.main} stopOpacity={0.8} />
              <stop offset="95%" stopColor={theme.palette.info.main} stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="formattedDate" />
          <YAxis />
          <Tooltip 
            formatter={(value: number) => [value, '']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="totalVisits" 
            name="Total Visits"
            stroke={theme.palette.primary.main} 
            fillOpacity={1} 
            fill="url(#totalVisits)" 
          />
          <Area 
            type="monotone" 
            dataKey="checkedIn" 
            name="Checked In"
            stroke={theme.palette.success.main} 
            fillOpacity={1} 
            fill="url(#checkedIn)" 
          />
          <Area 
            type="monotone" 
            dataKey="checkedOut" 
            name="Checked Out"
            stroke={theme.palette.info.main} 
            fillOpacity={1} 
            fill="url(#checkedOut)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </Box>
  );
};