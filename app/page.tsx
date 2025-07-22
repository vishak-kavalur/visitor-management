import { Box, Button, Container, Grid, Paper, Typography } from '@mui/material';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box
        sx={{
          pt: 8,
          pb: 6,
          textAlign: 'center',
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="primary"
          gutterBottom
        >
          Visitor Management System
        </Typography>
        <Typography variant="h5" align="center" color="text.secondary" paragraph>
          Streamline your visitor check-in process, enhance security, and create a
          professional first impression with our comprehensive visitor management solution.
        </Typography>
        <Box sx={{ mt: 4 }}>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Link href="/login" passHref>
                <Button variant="contained" color="primary" size="large">
                  Login
                </Button>
              </Link>
            </Grid>
            <Grid item>
              <Link href="/dashboard" passHref>
                <Button variant="outlined" color="primary" size="large">
                  Dashboard
                </Button>
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Features Section */}
      <Grid container spacing={4} sx={{ mb: 8 }}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom color="primary">
              Streamlined Check-In
            </Typography>
            <Typography align="center">
              Quick and efficient digital check-in process that captures all necessary
              visitor information while eliminating paper logbooks.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom color="primary">
              Enhanced Security
            </Typography>
            <Typography align="center">
              Improve facility security with visitor photos, ID scanning, and
              automatic host notifications for every visitor arrival.
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 3,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography variant="h5" component="h2" gutterBottom color="primary">
              Real-Time Analytics
            </Typography>
            <Typography align="center">
              Gain valuable insights with comprehensive reporting tools that
              track visitor traffic, peak times, and visit durations.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          py: 3,
          mt: 'auto',
          backgroundColor: '#f5f5f5', // Static color instead of dynamic function
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} Visitor Management System. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Container>
  );
}
