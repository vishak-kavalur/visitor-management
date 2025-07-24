# Visitor Management System - Postman Collection

This directory contains a complete Postman collection for testing and interacting with the Visitor Management System API.

## Contents

- `vms-api-collection.json` - The complete API collection
- `vms-environment.json` - Environment variables for the collection

## Setup Instructions

### 1. Import the Collection and Environment

1. Open Postman
2. Click on "Import" in the top left corner
3. Select both files:
   - `vms-api-collection.json`
   - `vms-environment.json`
4. Click "Import"

### 2. Select the Environment

1. After importing, select the "Visitor Management System Environment" from the environment dropdown in the top right corner
2. Verify the environment variables are set correctly:
   - `baseUrl` is set to `http://localhost:4000` (web application)
   - `socketUrl` is set to `http://localhost:4001` (Socket.IO server)

### 3. API Access

**Important Update**: API endpoints no longer require authentication. You can directly access all API endpoints without authentication tokens.

If you need to access authenticated web pages or want to test the authentication flow:

1. Go to the "Authentication" folder in the collection
2. Run the "Login" request with your credentials
   - This will automatically set the `authToken` environment variable
3. You can verify your authentication by running the "Auth Status" request

### 4. API Testing Workflow

The collection is organized into logical folders for different aspects of the system:

1. **Authentication** - Login, logout, and token management
2. **Dashboard** - Dashboard data endpoints
3. **Visitors** - Visitor management
4. **Visits** - Visit management and status updates
5. **Hosts** - Host user management
6. **Departments** - Department management
7. **Analytics** - Data analytics endpoints
8. **System** - System-level endpoints like health checks
9. **Socket.IO** - Real-time event testing

### 5. Variable Management

The collection uses several environment variables to store values between requests:

- `baseUrl` - The base URL of the web application API (port 4000)
- `socketUrl` - The URL of the Socket.IO server (port 4001)
- `authToken` - The JWT authentication token (for web page access)
- `visitorId` - ID of a created visitor
- `hostId` - ID of a created host
- `departmentId` - ID of a created department
- `visitId` - ID of a created visit

These variables are automatically set when you create resources and then used in subsequent requests.

### 6. Socket.IO Testing

To test real-time functionality with Socket.IO:

1. Use the Socket.IO tester in the "Socket.IO" folder
2. Connect to the Socket.IO server at `http://localhost:4001`
3. Subscribe to event rooms (e.g., "department:{departmentId}")
4. Trigger events by making API calls that change data
5. Observe real-time events being received

## Testing Sequence

For a complete testing flow, follow this sequence:

1. Create a department (store departmentId)
2. Create a host (store hostId)
3. Create a visitor (store visitorId)
4. Create a visit (store visitId)
5. Test status updates on the visit
6. Test analytics endpoints
7. Test dashboard endpoints
8. Test real-time notifications via Socket.IO

## Notes

- API endpoints no longer require authentication
- Web pages still require JWT token-based authentication
- Socket.IO server runs on port 4001, separate from the main API
- The collection includes test scripts that automatically set environment variables
- Pre-request scripts are used where necessary to prepare request data
- All requests include detailed descriptions of their purpose and required parameters