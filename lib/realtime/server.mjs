import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
// Try to load from .env.local first, fallback to .env if it exists
const envLocalPath = resolve(process.cwd(), '.env.local');
const envPath = resolve(process.cwd(), '.env');

if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Port configuration
const PORT = process.env.SOCKET_PORT || 4001;

// Create HTTP server
const httpServer = http.createServer();

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:4000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Connection event handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join room based on user ID or role
  socket.on('join', (data) => {
    const { userId, role } = data;
    
    if (userId) {
      socket.join(`user:${userId}`);
      console.log(`User ${userId} joined their private room`);
    }
    
    if (role) {
      socket.join(`role:${role}`);
      console.log(`User joined ${role} room`);
    }
  });

  // Handle notification event
  socket.on('notification', (data) => {
    const { target, message, type } = data;
    
    // If target is specified, send to specific user/role
    if (target?.userId) {
      io.to(`user:${target.userId}`).emit('notification', { message, type });
      console.log(`Notification sent to user ${target.userId}`);
    } else if (target?.role) {
      io.to(`role:${target.role}`).emit('notification', { message, type });
      console.log(`Notification sent to role ${target.role}`);
    } else {
      // Broadcast to all clients if no target specified
      socket.broadcast.emit('notification', { message, type });
      console.log('Notification broadcast to all clients');
    }
  });

  // Handle visit status update
  socket.on('visit-status-update', (data) => {
    const { visitId, status, notifyUsers } = data;
    
    // Broadcast visit status update to specified users
    if (notifyUsers && Array.isArray(notifyUsers)) {
      notifyUsers.forEach(userId => {
        io.to(`user:${userId}`).emit('visit-status-update', { visitId, status });
      });
      console.log(`Visit status update for visit ${visitId} sent to ${notifyUsers.length} users`);
    } else {
      // Broadcast to all if no specific users
      socket.broadcast.emit('visit-status-update', { visitId, status });
      console.log(`Visit status update for visit ${visitId} broadcast to all`);
    }
  });

  // Disconnection handler
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start the server
httpServer.listen(PORT, () => {
  console.log(`Socket.IO server running on port ${PORT}`);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('Shutting down Socket.IO server');
  httpServer.close(() => {
    console.log('Socket.IO server closed');
    process.exit(0);
  });
});