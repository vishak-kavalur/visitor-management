# Socket.IO Testing Guide for Visitor Management System

This guide provides instructions for testing the real-time functionality of the Visitor Management System using Postman and other Socket.IO testing tools.

## Overview

The Visitor Management System now includes a dedicated Socket.IO server running on port 4001 that provides real-time updates for various system events. This allows clients to receive immediate notifications when changes occur, without polling the API.

## Socket.IO Server Details

- **URL**: `http://localhost:4001`
- **Protocol**: Socket.IO (WebSocket with fallbacks)
- **Authentication**: No authentication required for Socket.IO connections

## Events

### Server Events (sent from server to client)

| Event | Description | Payload Example |
|-------|-------------|-----------------|
| `visitor:created` | New visitor registered | `{ "_id": "visitor_id", "fullName": "Visitor Name", ... }` |
| `visit:created` | New visit request submitted | `{ "_id": "visit_id", "status": "Pending", ... }` |
| `visit:updated` | Visit status changed | `{ "_id": "visit_id", "status": "Approved", ... }` |
| `visit:approved` | Visit request approved | `{ "_id": "visit_id", "status": "Approved", ... }` |
| `visit:rejected` | Visit request rejected | `{ "_id": "visit_id", "status": "Rejected", ... }` |
| `visit:checkedIn` | Visitor checked in | `{ "_id": "visit_id", "status": "CheckedIn", ... }` |
| `visit:checkedOut` | Visitor checked out | `{ "_id": "visit_id", "status": "CheckedOut", ... }` |

### Client Events (sent from client to server)

| Event | Description | Payload Example |
|-------|-------------|-----------------|
| `join:room` | Join a specific room for notifications | `{ "room": "department:123" }` |
| `leave:room` | Leave a notification room | `{ "room": "department:123" }` |

## Room Types

Clients can subscribe to specific notification rooms to receive targeted events:

- `department:{departmentId}` - Notifications for a specific department
- `host:{hostId}` - Notifications for a specific host
- `admin` - Admin-level notifications
- `global` - System-wide notifications

## Testing with Postman

Postman provides limited support for WebSockets and Socket.IO. For basic testing:

1. Use the Postman WebSocket request type
2. Connect to `ws://localhost:4001/socket.io/?EIO=4&transport=websocket`
3. Send and receive messages in the Socket.IO protocol format

However, for more comprehensive testing, we recommend using dedicated Socket.IO testing tools.

## Testing with Socket.IO Client Tools

### Using Socket.IO Tester Chrome Extension

1. Install the "Socket.IO Tester" extension from the Chrome Web Store
2. Open the extension
3. Enter `http://localhost:4001` in the connection URL
4. Click "Connect"
5. Subscribe to events by entering event names
6. To join a room, emit a `join:room` event with the appropriate payload

### Using socket.io-client in Node.js

Create a simple test script:

```javascript
// test-socket.js
const io = require('socket.io-client');

// Connect to Socket.IO server
const socket = io('http://localhost:4001');

// Connection events
socket.on('connect', () => {
  console.log('Connected to Socket.IO server');
  
  // Join a room (e.g., admin room)
  socket.emit('join:room', { room: 'admin' });
  console.log('Joined admin room');
});

socket.on('disconnect', () => {
  console.log('Disconnected from Socket.IO server');
});

// Listen for events
socket.on('visitor:created', (data) => {
  console.log('New visitor created:', data);
});

socket.on('visit:updated', (data) => {
  console.log('Visit updated:', data);
});

// Keep the connection open
process.on('SIGINT', () => {
  socket.disconnect();
  process.exit();
});
```

Run with:
```
node test-socket.js
```

## Testing End-to-End

To test the full real-time functionality:

1. Connect to the Socket.IO server using one of the methods above
2. Subscribe to relevant events or join rooms
3. In Postman, use the API collection to trigger events:
   - Create a new visitor (triggers `visitor:created`)
   - Create a new visit (triggers `visit:created`)
   - Approve a visit (triggers `visit:approved` and `visit:updated`)
   - Check in a visitor (triggers `visit:checkedIn` and `visit:updated`)
4. Observe the real-time events in your Socket.IO client

## Troubleshooting

### Connection Issues

If you can't connect to the Socket.IO server:

1. Verify the server is running: `npm start` should start both HTTP and Socket.IO servers
2. Check that port 4001 is not blocked by a firewall
3. Ensure you're using the correct URL (`http://localhost:4001`, not `ws://localhost:4001`)
4. Check for CORS issues if connecting from a different domain

### Event Reception Issues

If you're not receiving events:

1. Verify you've joined the correct room for the events you're interested in
2. Ensure you're listening for the correct event names
3. Check the server logs for any error messages
4. Verify that events are being triggered by making API calls