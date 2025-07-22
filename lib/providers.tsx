'use client';

import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme';
import ErrorBoundary from '../components/ui/ErrorBoundary';
import NotificationsProvider from '../components/ui/Notifications';

type ProvidersProps = {
  children: React.ReactNode;
};

/**
 * Combined providers component for the application
 *
 * This component wraps all providers needed for the application:
 * - ErrorBoundary for catching React errors
 * - SessionProvider for authentication state
 * - ThemeProvider for MUI theming
 * - CssBaseline for MUI baseline styles
 * - NotificationsProvider for toast notifications
 */
export default function Providers({ children }: ProvidersProps) {
  return (
    <ErrorBoundary>
      <SessionProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NotificationsProvider />
          {children}
        </ThemeProvider>
      </SessionProvider>
    </ErrorBoundary>
  );
}