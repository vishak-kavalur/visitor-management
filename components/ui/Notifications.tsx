'use client';

import React from 'react';
import { ToastContainer, toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Default toast configuration options
 */
const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/**
 * Global notification functions for consistent toast messages
 */
export const notifications = {
  /**
   * Show a success toast notification
   * @param message Message to display
   * @param options Additional toast options
   */
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, { ...defaultOptions, ...options });
  },

  /**
   * Show an error toast notification
   * @param message Message to display
   * @param options Additional toast options
   */
  error: (message: string, options?: ToastOptions) => {
    toast.error(message, { ...defaultOptions, ...options });
  },

  /**
   * Show a warning toast notification
   * @param message Message to display
   * @param options Additional toast options
   */
  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, { ...defaultOptions, ...options });
  },

  /**
   * Show an info toast notification
   * @param message Message to display
   * @param options Additional toast options
   */
  info: (message: string, options?: ToastOptions) => {
    toast.info(message, { ...defaultOptions, ...options });
  },

  /**
   * Show a loading toast notification that can be updated later
   * @param message Message to display
   * @returns Toast ID that can be used to update or dismiss the toast
   */
  loading: (message: string) => {
    return toast.loading(message, defaultOptions);
  },

  /**
   * Update an existing toast notification
   * @param toastId ID of the toast to update
   * @param message New message
   * @param type Toast type
   * @param options Additional toast options
   */
  update: (
    toastId: string | number, 
    message: string, 
    type: 'success' | 'error' | 'warning' | 'info', 
    options?: ToastOptions
  ) => {
    toast.update(toastId, {
      render: message,
      type,
      ...defaultOptions,
      ...options,
      isLoading: false,
    });
  },

  /**
   * Dismiss a specific toast notification
   * @param toastId ID of the toast to dismiss
   */
  dismiss: (toastId?: string | number) => {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  },
};

/**
 * ToastContainer component to be included once in the app layout
 */
export const NotificationsProvider: React.FC = () => {
  return (
    <ToastContainer
      position="top-right"
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  );
};

export default NotificationsProvider;