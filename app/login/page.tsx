'use client';

import { useState } from 'react';
import { Box, Button, Container, Paper, Typography, Alert, CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import Link from 'next/link';
import { useAuth } from '../../lib/auth/client';
import { useSearchParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { formSchemas, LoginFormData } from '../../lib/validation/form-schemas';
import { FormTextField } from '../../components/ui/FormField';
import { notifications } from '../../components/ui/Notifications';

export default function LoginPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const { login, error: authError, loading } = useAuth();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

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

  const onSubmit = async (data: LoginFormData) => {
    try {
      setFormError(null);
      await login(data.email, data.password, callbackUrl);
    } catch (error) {
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
          
          {/* Error messages */}
          {(authError || formError) && (
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
              disabled={loading || isSubmitting}
            >
              {(loading || isSubmitting) ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
            
            <Box sx={{ textAlign: 'center' }}>
              <Link href="/" passHref>
                <Typography variant="body2" component="span" sx={{ cursor: 'pointer' }}>
                  Back to Home
                </Typography>
              </Link>
            </Box>
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