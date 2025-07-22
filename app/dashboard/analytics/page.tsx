'use client';

import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, Tabs, Tab, CircularProgress, Alert, Card, CardContent, Select, MenuItem, FormControl, InputLabel, useTheme } from '@mui/material';
import { useAuth } from '../../../lib/auth/client';
import { VisitTrendsChart } from '../../../components/analytics/VisitTrendsChart';
import { DepartmentStatsChart } from '../../../components/analytics/DepartmentStatsChart';
import { VisitStatusChart } from '../../../components/analytics/VisitStatusChart';
import { VisitCompletionRateChart } from '../../../components/analytics/VisitCompletionRateChart';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analytics-tabpanel-${index}`}
      aria-labelledby={`analytics-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `analytics-tab-${index}`,
    'aria-controls': `analytics-tabpanel-${index}`,
  };
}

export default function AnalyticsPage() {
  const theme = useTheme();
  const { user, loading: authLoading } = useAuth();
  const [tabIndex, setTabIndex] = useState(0);
  const [period, setPeriod] = useState('daily');
  const [days, setDays] = useState(30);
  
  interface VisitAnalyticsData {
    period: string;
    days: number;
    data: {
      date: string;
      totalVisits: number;
      approved: number;
      rejected: number;
      checkedIn: number;
      checkedOut: number;
      pending: number;
      completionRate: number;
    }[];
    summary: {
      totalVisits: number;
      totalCompletions: number;
      overallCompletionRate: number;
    };
  }
  
  interface DepartmentAnalyticsData {
    period: string;
    startDate: string;
    endDate: string;
    data: {
      _id: string;
      departmentName: string;
      totalVisits: number;
      approved: number;
      rejected: number;
      checkedIn: number;
      checkedOut: number;
      pending: number;
      completionRate: number;
    }[];
    summary: {
      totalDepartments: number;
      totalVisits: number;
      totalCheckedOut: number;
      overallCompletionRate: number;
    };
  }
  
  const [visitsData, setVisitsData] = useState<{ data: VisitAnalyticsData } | null>(null);
  const [departmentsData, setDepartmentsData] = useState<{ data: DepartmentAnalyticsData } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  // Handle period change
  const handlePeriodChange = (event: { target: { value: string } }) => {
    setPeriod(event.target.value);
  };

  // Handle days change
  const handleDaysChange = (event: { target: { value: unknown } }) => {
    setDays(event.target.value as number);
  };

  // Fetch visit analytics data
  useEffect(() => {
    async function fetchVisitsData() {
      try {
        setLoading(true);
        const response = await fetch(`/api/analytics/visits?period=${period}&days=${days}`);
        if (!response.ok) {
          throw new Error('Failed to fetch visits analytics data');
        }
        const data = await response.json();
        setVisitsData(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    fetchVisitsData();
  }, [period, days]);

  // Fetch department analytics data (only for SuperAdmin)
  useEffect(() => {
    async function fetchDepartmentsData() {
      if (user?.role !== 'SuperAdmin') return;

      try {
        setLoading(true);
        const response = await fetch('/api/analytics/departments?period=month');
        if (!response.ok) {
          throw new Error('Failed to fetch department analytics data');
        }
        const data = await response.json();
        setDepartmentsData(data);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    if (user?.role === 'SuperAdmin') {
      fetchDepartmentsData();
    }
  }, [user?.role]);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '70vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" component="h1" gutterBottom>
        Analytics Dashboard
      </Typography>

      {/* Time period filter */}
      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <FormControl variant="outlined" size="small" sx={{ minWidth: 150 }}>
          <InputLabel id="period-select-label">Time Period</InputLabel>
          <Select
            labelId="period-select-label"
            id="period-select"
            value={period}
            onChange={handlePeriodChange}
            label="Time Period"
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </Select>
        </FormControl>

        <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
          <InputLabel id="days-select-label">Days</InputLabel>
          <Select
            labelId="days-select-label"
            id="days-select"
            value={days}
            onChange={handleDaysChange}
            label="Days"
          >
            <MenuItem value={7}>7 days</MenuItem>
            <MenuItem value={30}>30 days</MenuItem>
            <MenuItem value={60}>60 days</MenuItem>
            <MenuItem value={90}>90 days</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs for different analytics views */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabIndex} onChange={handleTabChange} aria-label="analytics tabs">
          <Tab label="Visit Trends" {...a11yProps(0)} />
          <Tab label="Visit Status" {...a11yProps(1)} />
          {user?.role === 'SuperAdmin' && <Tab label="Department Stats" {...a11yProps(2)} />}
        </Tabs>
      </Box>

      {/* Visit Trends Tab */}
      <TabPanel value={tabIndex} index={0}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, height: '400px' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <VisitTrendsChart data={visitsData?.data?.data || []} period={period} />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2, height: '350px' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <VisitCompletionRateChart data={visitsData?.data?.data || []} />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Summary
                </Typography>
                {loading ? (
                  <CircularProgress size={20} />
                ) : (
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Visits
                      </Typography>
                      <Typography variant="h5">
                        {visitsData?.data?.summary?.totalVisits || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Total Completions
                      </Typography>
                      <Typography variant="h5">
                        {visitsData?.data?.summary?.totalCompletions || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Completion Rate
                      </Typography>
                      <Typography variant="h5">
                        {(visitsData?.data?.summary?.overallCompletionRate || 0).toFixed(1)}%
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="subtitle2" color="text.secondary">
                        Time Period
                      </Typography>
                      <Typography variant="h5">
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </Typography>
                    </Grid>
                  </Grid>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Visit Status Tab */}
      <TabPanel value={tabIndex} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '400px' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <CircularProgress />
                </Box>
              ) : (
                <VisitStatusChart data={visitsData?.data?.data || []} />
              )}
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card sx={{ height: '400px' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Distribution
                </Typography>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  visitsData?.data?.data && visitsData.data.data.length > 0 ? (
                    <Box sx={{ mt: 4 }}>
                      {['approved', 'checkedIn', 'checkedOut', 'pending', 'rejected'].map((status) => {
                        const totalForStatus = visitsData.data.data.reduce(
                          (sum: number, item) => {
                            // Safe access with proper typing
                            let value = 0;
                            if (status === 'approved') value = item.approved;
                            else if (status === 'checkedIn') value = item.checkedIn;
                            else if (status === 'checkedOut') value = item.checkedOut;
                            else if (status === 'pending') value = item.pending;
                            else if (status === 'rejected') value = item.rejected;
                            return sum + value;
                          },
                          0
                        );
                        const percentage = visitsData.data.summary.totalVisits > 0 
                          ? (totalForStatus / visitsData.data.summary.totalVisits) * 100 
                          : 0;
                        
                        return (
                          <Box key={status} sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                              <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                                {status}
                              </Typography>
                              <Typography variant="body2" fontWeight="bold">
                                {totalForStatus} ({percentage.toFixed(1)}%)
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                height: 8,
                                width: '100%',
                                bgcolor: 'grey.300',
                                borderRadius: 1,
                                position: 'relative',
                              }}
                            >
                              <Box
                                sx={{
                                  height: '100%',
                                  width: `${percentage}%`,
                                  borderRadius: 1,
                                  bgcolor: theme.palette.primary.main,
                                }}
                              />
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 4, textAlign: 'center' }}>
                      No data available
                    </Typography>
                  )
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Department Stats Tab (SuperAdmin only) */}
      {user?.role === 'SuperAdmin' && (
        <TabPanel value={tabIndex} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, height: '400px' }}>
                {loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <DepartmentStatsChart data={departmentsData?.data?.data || []} />
                )}
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Department Summary
                  </Typography>
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <Grid container spacing={2}>
                      <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Departments
                        </Typography>
                        <Typography variant="h5">
                          {departmentsData?.data?.summary?.totalDepartments || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Visits
                        </Typography>
                        <Typography variant="h5">
                          {departmentsData?.data?.summary?.totalVisits || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Total Checked Out
                        </Typography>
                        <Typography variant="h5">
                          {departmentsData?.data?.summary?.totalCheckedOut || 0}
                        </Typography>
                      </Grid>
                      <Grid item xs={6} md={3}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Overall Completion Rate
                        </Typography>
                        <Typography variant="h5">
                          {(departmentsData?.data?.summary?.overallCompletionRate || 0).toFixed(1)}%
                        </Typography>
                      </Grid>
                    </Grid>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>
      )}
    </Container>
  );
}