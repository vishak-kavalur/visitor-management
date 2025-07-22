'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';
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

interface VisitCompletionRateChartProps {
  data: VisitDataPoint[];
}

export const VisitCompletionRateChart: React.FC<VisitCompletionRateChartProps> = ({ data }) => {
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
          No completion rate data available
        </Typography>
      </Box>
    );
  }

  // Process data for chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
    completionRate: Math.round(item.completionRate * 10) / 10 // Round to 1 decimal place
  }));

  // Calculate average completion rate
  const averageCompletionRate = chartData.reduce((sum, item) => sum + item.completionRate, 0) / chartData.length;
  const roundedAverage = Math.round(averageCompletionRate * 10) / 10;

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Visit Completion Rate Trend
      </Typography>
      <ResponsiveContainer width="100%" height="90%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="formattedDate" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'Completion Rate']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <ReferenceLine 
            y={roundedAverage} 
            label={`Avg: ${roundedAverage}%`} 
            stroke={theme.palette.grey[500]} 
            strokeDasharray="3 3" 
          />
          <Line 
            type="monotone" 
            dataKey="completionRate" 
            name="Completion Rate" 
            stroke={theme.palette.secondary.main}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Box>
  );
};