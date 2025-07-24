'use client';

import React, { useEffect } from 'react';
import { useSocket } from '../../lib/realtime';
import { useSession } from 'next-auth/react';

/**
 * RealtimeProvider component that initializes socket connection
 * and joins appropriate rooms based on user session
 */
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { socket, isConnected, joinRoom } = useSocket();
  const { data: session } = useSession();

  // Join appropriate socket rooms when connection is established and user is authenticated
  useEffect(() => {
    if (isConnected && session?.user) {
      // Join user-specific room using the user ID from session
      const userId = session.user.id as string;
      // Join role-specific room if user has a role
      const role = session.user.role;
      
      joinRoom(userId, role);
      
      console.log('Joined socket rooms for user:', userId, role ? `with role ${role}` : '');
    }
  }, [isConnected, session, joinRoom]);

  return (
    <>
      {/* Include status indicator for development environments */}
      {process.env.NODE_ENV === 'development' && (
        <div
          style={{
            position: 'fixed',
            bottom: 10,
            right: 10,
            padding: '4px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            zIndex: 9999,
            backgroundColor: isConnected ? '#4caf50' : '#f44336',
            color: 'white',
          }}
        >
          Socket: {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      )}
      {children}
    </>
  );
};

export default RealtimeProvider;