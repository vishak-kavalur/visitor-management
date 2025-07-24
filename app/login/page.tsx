'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Box, Button, Container, Paper, Typography, Alert, CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/client';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchemas, LoginFormData } from '../../lib/validation/form-schemas';
import { FormTextField } from '../../components/ui/FormField';
import { notifications } from '../../components/ui/Notifications';

// Loading component for Suspense fallback
function LoginLoading() {
  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minHeight: 400,
            justifyContent: 'center',
          }}
        >
          <CircularProgress size={40} />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading...
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
}

/**
 * Helper function for direct redirection
 * Provides a more reliable way to redirect users after authentication
 */
function forceRedirect(url: string): void {
  console.log(`Force redirecting to: ${url}`);
  // Use window.location.replace for the most reliable browser-level navigation
  // replace() is better than href as it doesn't add to browser history
  window.location.replace(url);
}

// Success component shown after successful login
function LoginSuccess({ callbackUrl }: { callbackUrl: string }) {
  return (
    <Box sx={{ textAlign: 'center', my: 2, width: '100%' }}>
      <Alert severity="success" sx={{ mb: 2 }}>
        Login successful! You will be redirected to the dashboard shortly.
      </Alert>
      <CircularProgress size={30} sx={{ mb: 2 }} />
      <Typography variant="body2" sx={{ mb: 2 }}>
        If you are not redirected automatically, please click the button below.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => forceRedirect(callbackUrl)}
        sx={{ mt: 1 }}
      >
        Continue to Dashboard
      </Button>
    </Box>
  );
}

// Login form component that uses useSearchParams
function LoginForm() {
  const [formError, setFormError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const { login, error: authError, loading, isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  const redirectAttempted = useRef(false);

  // Set up form with validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(formSchemas.login),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  // Effect to check authentication status and force redirect
  useEffect(() => {
    console.log("Login page: Checking authentication status, isAuthenticated=", isAuthenticated);
    
    // Check if user is already authenticated on page load
    if (isAuthenticated && !redirectAttempted.current) {
      console.log("Login page: User is already authenticated, redirecting...");
      redirectAttempted.current = true;
      setLoginSuccess(true);
      
      // Redirect immediately - middleware should prevent redirect loops
      forceRedirect(callbackUrl);
    }
  }, [isAuthenticated, callbackUrl]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      console.log("Login page: Form submitted, attempting login");
      setFormError(null);
      
      // Reset redirect state before attempting login
      redirectAttempted.current = false;
      
      // Call login function
      const success = await login(data.email, data.password, callbackUrl);
      
      // Handle successful login
      if (success) {
        console.log("Login page: Login successful via form submission");
        setLoginSuccess(true);
        
        // Use a single redirect mechanism
        // Small delay to allow state updates to complete
        setTimeout(() => {
          console.log("Login page: Redirecting after successful login");
          forceRedirect(callbackUrl);
        }, 1000);
      } else {
        console.log("Login page: Login attempt failed");
      }
    } catch (error) {
      console.error("Login page: Error during login", error);
      if (error instanceof Error) {
        setFormError(error.message);
      } else {
        setFormError('An unexpected error occurred');
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Typography component="h1" variant="h5" sx={{ mb: 3 }}>
            Visitor Management System
          </Typography>
          <Typography component="h2" variant="h6">
            Sign in
          </Typography>
          
          {/* Success/Error messages */}
          {loginSuccess ? (
            <LoginSuccess callbackUrl={callbackUrl} />
          ) : (authError || formError) && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {formError || authError}
            </Alert>
          )}
          
          <Box
            component="form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            sx={{ mt: 1, width: '100%' }}
          >
            <FormTextField
              name="email"
              control={control}
              label="Email Address"
              required
              autoComplete="email"
              autoFocus
              disabled={loading || isSubmitting}
              fullWidth
            />
            
            <FormTextField
              name="password"
              control={control}
              label="Password"
              type="password"
              required
              autoComplete="current-password"
              disabled={loading || isSubmitting}
              fullWidth
            />
            
            <FormControlLabel
              control={
                <Controller
                  name="rememberMe"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      {...field}
                      checked={field.value}
                      disabled={loading || isSubmitting}
                    />
                  )}
                />
              }
              label="Remember me"
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading || isSubmitting || loginSuccess}
            >
              {(loading || isSubmitting) ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            {/* Manual redirect button that appears if login was successful but redirect didn't happen */}
            {loginSuccess && (
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                onClick={() => forceRedirect(callbackUrl)}
                sx={{ mb: 2 }}
              >
                Continue to Dashboard
              </Button>
            )}
            
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/" passHref>
                <Typography variant="body2" component="span" sx={{ cursor: 'pointer' }}>
                  Back to Home
                </Typography>
              </Link>
            </Box>
            
            {/* Login helper info */}
          </Box>
        </Paper>
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Demo Credentials:
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Email: admin@example.com
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Password: password123
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}

// Main page component with Suspense boundary
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginLoading />}>
      <LoginForm />
    </Suspense>
  );
}