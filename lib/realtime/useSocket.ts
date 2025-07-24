'use client';

import { useEffect, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { notifications } from '../../components/ui/Notifications';

// Types for socket hook
export interface NotificationData {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface VisitStatusUpdate {
  visitId: string;
  status: string;
}

export interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  sendNotification: (target: { userId?: string; role?: string } | null, message: string, type: NotificationData['type']) => void;
  updateVisitStatus: (visitId: string, status: string, notifyUsers?: string[]) => void;
  joinRoom: (userId?: string, role?: string) => void;
}

/**
 * Hook to manage socket.io connection and interactions
 */
export function useSocket(): UseSocketReturn {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  // Initialize socket connection
  useEffect(() => {
    // Get the socket URL from environment variable
    const socketUrl = process.env.SOCKET_SERVER_URL || 'http://localhost:4001';
    
    // Create socket instance
    const socketInstance = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
      withCredentials: true,
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setIsConnected(false);
    });

    // Event listeners for incoming messages
    socketInstance.on('notification', (data: NotificationData) => {
      const { message, type } = data;
      
      if (type === 'success') {
        notifications.success(message);
      } else if (type === 'error') {
        notifications.error(message);
      } else if (type === 'warning') {
        notifications.warning(message);
      } else {
        notifications.info(message);
      }
    });

    socketInstance.on('visit-status-update', (data: VisitStatusUpdate) => {
      const { visitId, status } = data;
      console.log(`Visit ${visitId} status updated to ${status}`);
      // You can add additional handling here, such as refreshing data
      // or showing a notification about the status update
    });

    setSocket(socketInstance);

    // Cleanup function
    return () => {
      socketInstance.disconnect();
      socketInstance.off('connect');
      socketInstance.off('disconnect');
      socketInstance.off('connect_error');
      socketInstance.off('notification');
      socketInstance.off('visit-status-update');
    };
  }, []);

  /**
   * Send notification to specific user, role, or broadcast
   */
  const sendNotification = useCallback(
    (target: { userId?: string; role?: string } | null, message: string, type: NotificationData['type']) => {
      if (socket && isConnected) {
        socket.emit('notification', { target, message, type });
      }
    },
    [socket, isConnected]
  );

  /**
   * Update visit status and notify users
   */
  const updateVisitStatus = useCallback(
    (visitId: string, status: string, notifyUsers?: string[]) => {
      if (socket && isConnected) {
        socket.emit('visit-status-update', { visitId, status, notifyUsers });
      }
    },
    [socket, isConnected]
  );

  /**
   * Join user or role-specific room
   */
  const joinRoom = useCallback(
    (userId?: string, role?: string) => {
      if (socket && isConnected && (userId || role)) {
        socket.emit('join', { userId, role });
      }
    },
    [socket, isConnected]
  );

  return {
    socket,
    isConnected,
    sendNotification,
    updateVisitStatus,
    joinRoom,
  };
}

export default useSocket;