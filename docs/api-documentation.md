# API Documentation

This document provides comprehensive documentation for all API endpoints in the Visitor Management System.

## API Overview

The Visitor Management System API:
- Runs on port 4000 (http://localhost:4000)
- Uses RESTful conventions
- Returns JSON responses
- **No longer requires authentication for API endpoints** (authentication is only required for web pages)
- Supports token-based authentication (JWT) without cookies for authenticated operations

## Response Format

All API responses follow this standard format:

```json
{
  "success": true,
  "data": {},  // Response data
  "message": "Success message",
  "pagination": {}  // Pagination details (for list endpoints)
}
```

Error responses:

```json
{
  "success": false,
  "error": {
    "message": "Error message",
    "details": "Additional error details (optional)",
    "code": "ERROR_CODE (optional)"
  },
  "statusCode": 400
}
```

## Authentication

### POST /api/auth/[...nextauth]

Next.js NextAuth endpoint for authentication. This is automatically handled by NextAuth.js.

**Note:** The system now uses token-based authentication without cookies. Tokens are passed via Authorization header.

### GET /api/auth/status

Check the current authentication status.

**Response:**
```json
{
  "success": true,
  "data": {
    "isAuthenticated": true,
    "user": {
      "id": "user_id",
      "email": "user@example.com",
      "name": "User Name",
      "role": "Admin",
      "departmentId": "department_id",
    }
  }
}
```

## Visitor Management

### GET /api/visitors

Get a paginated list of visitors.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `name`: Filter by name (optional)
- `aadhaarNumber`: Filter by Aadhaar number (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "visitor_id",
      "aadhaarNumber": "1234-5678-9012",
      "fullName": "Visitor Name",
      "imageBase64": "base64_encoded_image",
      "firstVisit": "2023-01-01T00:00:00.000Z",
      "lastVisit": "2023-02-01T00:00:00.000Z",
      "createdTime": "2023-01-01T00:00:00.000Z"
    }
  ],
  "message": "Visitors retrieved successfully",
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### GET /api/visitors/:id

Get a single visitor by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "visitor_id",
    "aadhaarNumber": "1234-5678-9012",
    "fullName": "Visitor Name",
    "imageBase64": "base64_encoded_image",
    "firstVisit": "2023-01-01T00:00:00.000Z",
    "lastVisit": "2023-02-01T00:00:00.000Z",
    "createdTime": "2023-01-01T00:00:00.000Z",
    "visits": [
      {
        "_id": "visit_id",
        "status": "Approved",
        "purposeOfVisit": "Meeting",
        "submissionTimestamp": "2023-01-01T00:00:00.000Z"
      }
    ]
  },
  "message": "Visitor retrieved successfully"
}
```

### POST /api/visitors

Create a new visitor.

**Request Body:**
```json
{
  "aadhaarNumber": "1234-5678-9012",
  "fullName": "Visitor Name",
  "imageBase64": "base64_encoded_image"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "visitor_id",
    "aadhaarNumber": "1234-5678-9012",
    "fullName": "Visitor Name",
    "imageBase64": "base64_encoded_image",
    "firstVisit": "2023-01-01T00:00:00.000Z",
    "createdTime": "2023-01-01T00:00:00.000Z"
  },
  "message": "Visitor created successfully"
}
```

### PUT /api/visitors/:id

Update a visitor.

**Request Body:**
```json
{
  "fullName": "Updated Visitor Name",
  "imageBase64": "updated_base64_encoded_image"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "visitor_id",
    "aadhaarNumber": "1234-5678-9012",
    "fullName": "Updated Visitor Name",
    "imageBase64": "updated_base64_encoded_image",
    "firstVisit": "2023-01-01T00:00:00.000Z",
    "lastVisit": "2023-02-01T00:00:00.000Z",
    "createdTime": "2023-01-01T00:00:00.000Z"
  },
  "message": "Visitor updated successfully"
}
```

### DELETE /api/visitors/:id

Delete a visitor.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visitor_id"
  },
  "message": "Visitor deleted successfully"
}
```

## Visit Management

### GET /api/visits

Get a paginated list of visits.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `status`: Filter by status (optional)
- `departmentId`: Filter by department (optional)
- `hostId`: Filter by host (optional)
- `visitorId`: Filter by visitor (optional)
- `startDate`: Filter by start date (optional)
- `endDate`: Filter by end date (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "visit_id",
      "status": "Pending",
      "visitorId": {
        "_id": "visitor_id",
        "fullName": "Visitor Name"
      },
      "hostId": {
        "_id": "host_id",
        "fullName": "Host Name"
      },
      "departmentId": {
        "_id": "department_id",
        "name": "Department Name"
      },
      "purposeOfVisit": "Meeting",
      "submissionTimestamp": "2023-01-01T00:00:00.000Z",
      "approval": null,
      "checkInTimestamp": null,
      "checkOutTimestamp": null
    }
  ],
  "message": "Visits retrieved successfully",
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### GET /api/visits/:id

Get a single visit by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "visit_id",
    "status": "Approved",
    "visitorId": {
      "_id": "visitor_id",
      "fullName": "Visitor Name",
      "aadhaarNumber": "1234-5678-9012",
      "imageBase64": "base64_encoded_image"
    },
    "hostId": {
      "_id": "host_id",
      "fullName": "Host Name",
      "email": "host@example.com"
    },
    "departmentId": {
      "_id": "department_id",
      "name": "Department Name",
      "floor": "3rd Floor",
      "building": "Main Building"
    },
    "purposeOfVisit": "Meeting",
    "submissionTimestamp": "2023-01-01T00:00:00.000Z",
    "approval": {
      "approvedBy": {
        "_id": "admin_id",
        "fullName": "Admin Name"
      },
      "timestamp": "2023-01-01T01:00:00.000Z"
    },
    "checkInTimestamp": "2023-01-01T10:00:00.000Z",
    "checkOutTimestamp": null
  },
  "message": "Visit retrieved successfully"
}
```

### POST /api/visits

Create a new visit request.

**Request Body:**
```json
{
  "visitorId": "visitor_id",
  "hostId": "host_id",
  "departmentId": "department_id",
  "purposeOfVisit": "Meeting"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "visit_id",
    "status": "Pending",
    "visitorId": "visitor_id",
    "hostId": "host_id",
    "departmentId": "department_id",
    "purposeOfVisit": "Meeting",
    "submissionTimestamp": "2023-01-01T00:00:00.000Z"
  },
  "message": "Visit request submitted successfully"
}
```

### PUT /api/visits/:id

Update a visit.

**Request Body:**
```json
{
  "purposeOfVisit": "Updated purpose",
  "status": "Approved"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "visit_id",
    "status": "Approved",
    "visitorId": "visitor_id",
    "hostId": "host_id",
    "departmentId": "department_id",
    "purposeOfVisit": "Updated purpose",
    "submissionTimestamp": "2023-01-01T00:00:00.000Z",
    "approval": {
      "approvedBy": "admin_id",
      "timestamp": "2023-01-01T01:00:00.000Z"
    }
  },
  "message": "Visit updated successfully"
}
```

### POST /api/visits/:id/approve

Approve a visit request.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "visit_id",
    "status": "Approved",
    "approval": {
      "approvedBy": "admin_id",
      "timestamp": "2023-01-01T01:00:00.000Z"
    }
  },
  "message": "Visit approved successfully"
}
```

### POST /api/visits/:id/reject

Reject a visit request.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "visit_id",
    "status": "Rejected"
  },
  "message": "Visit rejected successfully"
}
```

### DELETE /api/visits/:id

Delete a visit.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "visit_id"
  },
  "message": "Visit deleted successfully"
}
```

## Department Management

### GET /api/admin/departments

Get a paginated list of departments.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `name`: Filter by name (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "department_id",
      "name": "Department Name",
      "description": "Department description",
      "floor": "3rd Floor",
      "building": "Main Building",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "message": "Departments retrieved successfully",
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 10,
    "pages": 1
  }
}
```

### GET /api/admin/departments/:id

Get a single department by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "department_id",
    "name": "Department Name",
    "description": "Department description",
    "floor": "3rd Floor",
    "building": "Main Building",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "hostsCount": 5,
    "visitsCount": 20
  },
  "message": "Department retrieved successfully"
}
```

### POST /api/admin/departments

Create a new department.

**Request Body:**
```json
{
  "name": "Department Name",
  "description": "Department description",
  "floor": "3rd Floor",
  "building": "Main Building"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "department_id",
    "name": "Department Name",
    "description": "Department description",
    "floor": "3rd Floor",
    "building": "Main Building",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Department created successfully"
}
```

### PUT /api/admin/departments/:id

Update a department.

**Request Body:**
```json
{
  "name": "Updated Department Name",
  "description": "Updated description",
  "floor": "4th Floor",
  "building": "New Building"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "department_id",
    "name": "Updated Department Name",
    "description": "Updated description",
    "floor": "4th Floor",
    "building": "New Building",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  },
  "message": "Department updated successfully"
}
```

### DELETE /api/admin/departments/:id

Delete a department.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "department_id"
  },
  "message": "Department deleted successfully"
}
```

## Host Management

### GET /api/admin/hosts

Get a paginated list of hosts.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `name`: Filter by name (optional)
- `email`: Filter by email (optional)
- `role`: Filter by role (optional)
- `departmentId`: Filter by department (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "host_id",
      "email": "host@example.com",
      "fullName": "Host Name",
      "departmentId": {
        "_id": "department_id",
        "name": "Department Name"
      },
      "role": "Host",
      "createdAt": "2023-01-01T00:00:00.000Z",
      "updatedAt": "2023-01-01T00:00:00.000Z"
    }
  ],
  "message": "Hosts retrieved successfully",
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### GET /api/admin/hosts/:id

Get a single host by ID.

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "host_id",
    "email": "host@example.com",
    "fullName": "Host Name",
    "departmentId": {
      "_id": "department_id",
      "name": "Department Name",
      "floor": "3rd Floor",
      "building": "Main Building"
    },
    "role": "Host",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z",
    "visitsCount": 15
  },
  "message": "Host retrieved successfully"
}
```

### POST /api/admin/hosts

Create a new host.

**Request Body:**
```json
{
  "email": "host@example.com",
  "password": "securePassword123",
  "fullName": "Host Name",
  "departmentId": "department_id",
  "role": "Host"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "host_id",
    "email": "host@example.com",
    "fullName": "Host Name",
    "departmentId": "department_id",
    "role": "Host",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  },
  "message": "Host created successfully"
}
```

### PUT /api/admin/hosts/:id

Update a host.

**Request Body:**
```json
{
  "fullName": "Updated Host Name",
  "departmentId": "new_department_id",
  "role": "Admin"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "host_id",
    "email": "host@example.com",
    "fullName": "Updated Host Name",
    "departmentId": "new_department_id",
    "role": "Admin",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-02T00:00:00.000Z"
  },
  "message": "Host updated successfully"
}
```

### DELETE /api/admin/hosts/:id

Delete a host.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "host_id"
  },
  "message": "Host deleted successfully"
}
```

## Dashboard Endpoints

### GET /api/dashboard/summary

Get dashboard summary data.

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVisits": 120,
    "pendingApprovals": 5,
    "todayVisits": 8,
    "completedVisits": 100,
    "recentVisits": [
      {
        "_id": "visit_id",
        "status": "CheckedIn",
        "visitorId": {
          "_id": "visitor_id",
          "fullName": "Visitor Name"
        },
        "hostId": {
          "_id": "host_id",
          "fullName": "Host Name"
        },
        "purposeOfVisit": "Meeting",
        "submissionTimestamp": "2023-01-01T00:00:00.000Z",
        "checkInTimestamp": "2023-01-01T10:00:00.000Z"
      }
    ]
  },
  "message": "Dashboard summary retrieved successfully"
}
```

### GET /api/dashboard/pending-approvals

Get pending approval requests.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "visit_id",
      "status": "Pending",
      "visitorId": {
        "_id": "visitor_id",
        "fullName": "Visitor Name"
      },
      "hostId": {
        "_id": "host_id",
        "fullName": "Host Name"
      },
      "departmentId": {
        "_id": "department_id",
        "name": "Department Name"
      },
      "purposeOfVisit": "Meeting",
      "submissionTimestamp": "2023-01-01T00:00:00.000Z"
    }
  ],
  "message": "Pending approvals retrieved successfully"
}
```

### GET /api/dashboard/recent-visits

Get recent visits.

**Query Parameters:**
- `limit`: Number of visits to return (default: 5)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "visit_id",
      "status": "CheckedOut",
      "visitorId": {
        "_id": "visitor_id",
        "fullName": "Visitor Name"
      },
      "hostId": {
        "_id": "host_id",
        "fullName": "Host Name"
      },
      "departmentId": {
        "_id": "department_id",
        "name": "Department Name"
      },
      "purposeOfVisit": "Meeting",
      "submissionTimestamp": "2023-01-01T00:00:00.000Z",
      "checkInTimestamp": "2023-01-01T10:00:00.000Z",
      "checkOutTimestamp": "2023-01-01T11:00:00.000Z"
    }
  ],
  "message": "Recent visits retrieved successfully"
}
```

## Analytics Endpoints

### GET /api/analytics/visits

Get visit analytics data.

**Query Parameters:**
- `startDate`: Start date for analytics (optional)
- `endDate`: End date for analytics (optional)
- `departmentId`: Filter by department (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "totalVisits": 120,
    "completedVisits": 100,
    "pendingVisits": 5,
    "rejectedVisits": 15,
    "visitsByStatus": [
      { "status": "Pending", "count": 5 },
      { "status": "Approved", "count": 0 },
      { "status": "Rejected", "count": 15 },
      { "status": "CheckedIn", "count": 0 },
      { "status": "CheckedOut", "count": 100 }
    ],
    "visitsByDay": [
      { "date": "2023-01-01", "count": 5 },
      { "date": "2023-01-02", "count": 8 },
      { "date": "2023-01-03", "count": 12 }
    ],
    "avgVisitDuration": 62 // in minutes
  },
  "message": "Visit analytics retrieved successfully"
}
```

### GET /api/analytics/departments

Get department analytics data.

**Query Parameters:**
- `startDate`: Start date for analytics (optional)
- `endDate`: End date for analytics (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "departmentVisits": [
      {
        "department": {
          "_id": "department_id",
          "name": "Department Name"
        },
        "visitsCount": 45
      }
    ],
    "topDepartments": [
      {
        "department": {
          "_id": "department_id",
          "name": "Department Name"
        },
        "visitsCount": 45
      }
    ],
    "visitsByDepartmentAndStatus": [
      {
        "department": {
          "_id": "department_id",
          "name": "Department Name"
        },
        "statusCounts": [
          { "status": "Pending", "count": 2 },
          { "status": "Approved", "count": 0 },
          { "status": "Rejected", "count": 3 },
          { "status": "CheckedIn", "count": 0 },
          { "status": "CheckedOut", "count": 40 }
        ]
      }
    ]
  },
  "message": "Department analytics retrieved successfully"
}
```

## Socket.IO Realtime API

The system now includes a Socket.IO server running on port 4001 for real-time communication.

### Connection

Connect to the Socket.IO server at: `http://localhost:4001`

### Events

#### Client Events (sent from client to server)

| Event | Description | Payload |
|-------|-------------|---------|
| `join:room` | Join a specific room for notifications | `{ room: "roomName" }` |
| `leave:room` | Leave a notification room | `{ room: "roomName" }` |

#### Server Events (sent from server to client)

| Event | Description | Payload |
|-------|-------------|---------|
| `visitor:created` | New visitor registered | Visitor object |
| `visit:created` | New visit request submitted | Visit object |
| `visit:updated` | Visit status changed | Visit object |
| `visit:approved` | Visit request approved | Visit object |
| `visit:rejected` | Visit request rejected | Visit object |
| `visit:checkedIn` | Visitor checked in | Visit object |
| `visit:checkedOut` | Visitor checked out | Visit object |

### Room Types

- `department:{departmentId}` - Notifications for a specific department
- `host:{hostId}` - Notifications for a specific host
- `admin` - Admin-level notifications
- `global` - System-wide notifications

## Common HTTP Status Codes

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate entry)
- `422 Unprocessable Entity`: Validation error
- `500 Internal Server Error`: Server error