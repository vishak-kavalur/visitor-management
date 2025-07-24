# Visitor Management System - Running and Debugging Guide

This document provides detailed instructions for running, maintaining, and debugging the Visitor Management System (VMS).

## Table of Contents

1. [Running the Application](#running-the-application)
2. [Development Workflow](#development-workflow)
3. [Monitoring](#monitoring)
4. [Debugging](#debugging)
5. [Common Issues](#common-issues)
6. [Performance Optimization](#performance-optimization)

## Running the Application

### Starting the Application

The Visitor Management System consists of two main components:
- The Next.js web application running on port 4000
- The Socket.IO server running on port 4001

To start both components:

```bash
# Production mode
npm start

# Development mode
npm run dev
```

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Starts the application in development mode with hot-reloading |
| `npm run build` | Builds the application for production |
| `npm start` | Starts the application in production mode |
| `npm run lint` | Runs ESLint to check code quality |
| `npm run test` | Runs the test suite |
| `npm run test:e2e` | Runs end-to-end tests |

### Port Configuration

The application uses the following ports:
- **4000**: Main Next.js web application
- **4001**: Socket.IO server for real-time communication

### Environment-Specific Behavior

The application behavior varies based on the `NODE_ENV` environment variable:

- **Development** (`NODE_ENV=development`)
  - Detailed error messages
  - Hot reloading enabled
  - Development-specific optimizations

- **Production** (`NODE_ENV=production`)
  - Optimized for performance
  - Minimized error details for security
  - Caching enabled

## Development Workflow

### Local Development

1. Start the application in development mode:
   ```bash
   npm run dev
   ```

2. Access the application at http://localhost:4000

3. Any changes to the code will automatically reload the application

### Code Structure

The application follows a standard Next.js project structure:

- `/app`: Next.js App Router components and routes
- `/components`: Reusable UI components
- `/lib`: Utility functions and business logic
- `/models`: Database models and schemas
- `/public`: Static assets
- `/styles`: Global CSS and styling

### Database Access

The application connects to MongoDB at `mongodb://localhost:27017/visitor-management` by default.

To access the database directly:

```bash
# Connect to MongoDB shell
mongosh mongodb://localhost:27017/visitor-management

# List collections
show collections

# Query visitors collection
db.visitors.find()
```

## Monitoring

### Application Logs

The application logs information to the console. In production, it's recommended to redirect logs to a file:

```bash
npm start > vms.log 2>&1
```

### Database Monitoring

To monitor MongoDB performance:

```bash
# Check MongoDB status
mongotop
mongostat
```

### Process Monitoring

If using PM2 for process management:

```bash
# Check application status
pm2 status

# View logs
pm2 logs vms

# Monitor CPU and memory usage
pm2 monit
```

## Debugging

### Server-Side Debugging

1. Start the application with debugging enabled:
   ```bash
   NODE_OPTIONS='--inspect' npm run dev
   ```

2. Open Chrome and navigate to `chrome://inspect`

3. Click on "Open dedicated DevTools for Node"

4. Set breakpoints and debug the server-side code

### Client-Side Debugging

1. Open the application in Chrome or Firefox

2. Open Developer Tools (F12 or Right-click > Inspect)

3. Navigate to the Sources/Debugger tab

4. Set breakpoints in your client-side JavaScript code

### Socket.IO Debugging

To debug Socket.IO connections:

1. Enable Socket.IO debug logs:
   ```bash
   DEBUG=socket.io* npm run dev
   ```

2. Monitor real-time events and connections in the console

## Common Issues

### Connection Refused on Port 4000/4001

**Problem**: The application fails to start with "EADDRINUSE" error.

**Solution**:
1. Check if another process is using the port:
   ```bash
   lsof -i :4000
   ```
2. Kill the process:
   ```bash
   kill -9 <PID>
   ```

### MongoDB Connection Issues

**Problem**: The application cannot connect to MongoDB.

**Solution**:
1. Verify MongoDB is running:
   ```bash
   systemctl status mongodb
   # or
   ps aux | grep mongo
   ```
2. Check MongoDB logs:
   ```bash
   cat /var/log/mongodb/mongodb.log
   ```
3. Ensure the connection string in `.env.local` is correct

### Authentication Failures

**Problem**: Users cannot log in or receive authentication errors.

**Solution**:
1. Check if JWT_SECRET and NEXTAUTH_SECRET are set correctly in `.env.local`
2. Verify that the database contains valid user records
3. Check for CORS issues if accessing from a different domain

### Socket.IO Connection Issues

**Problem**: Real-time updates are not working.

**Solution**:
1. Verify the Socket.IO server is running on port 4001
2. Check browser console for connection errors
3. Ensure the REMOTE_SERVER_URL is set correctly in the environment
4. Check if any firewalls are blocking WebSocket connections

## Performance Optimization

### Database Optimization

1. Ensure proper indexes are in place:
   ```javascript
   // Example: Create index on frequently queried fields
   db.visits.createIndex({ status: 1, submissionTimestamp: -1 })
   ```

2. Limit query results and use pagination:
   ```javascript
   const page = 1;
   const limit = 10;
   const skip = (page - 1) * limit;
   
   db.visits.find({}).skip(skip).limit(limit);
   ```

### Application Optimization

1. Enable production mode:
   ```
   NODE_ENV=production
   ```

2. Implement caching for frequently accessed data:
   ```javascript
   // Example: Cache dashboard summary data
   const cachedData = new Map();
   
   async function getDashboardData() {
     if (cachedData.has('dashboard') && cachedData.get('dashboard').expiry > Date.now()) {
       return cachedData.get('dashboard').data;
     }
     
     const data = await fetchDashboardDataFromDB();
     cachedData.set('dashboard', { 
       data, 
       expiry: Date.now() + 60000 // Cache for 1 minute
     });
     
     return data;
   }
   ```

3. Use incremental static regeneration for static pages where appropriate

### Frontend Optimization

1. Minimize bundle size by optimizing imports
2. Use code splitting with dynamic imports
3. Implement proper caching strategies for static assets
4. Optimize images and lazy load off-screen content