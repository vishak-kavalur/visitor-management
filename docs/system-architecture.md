# Visitor Management System - System Architecture

## Overview

The Visitor Management System (VMS) is a Next.js application designed to manage visitors, hosts, departments, and visits within an organization. The system provides role-based access control with different permissions for SuperAdmin, Admin, and Host users.

## Tech Stack

- **Frontend**: Next.js 15 with App Router, Material UI components
- **Backend**: Next.js API Routes (serverless architecture)
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: NextAuth.js with JWT strategy
- **Form Handling**: React Hook Form with Zod validation
- **Data Visualization**: Recharts for analytics dashboards

## System Components

### 1. Frontend Components

- **Dashboard Layout**: Common layout for all authenticated dashboard pages
- **Authentication**: Login page and authentication state management
- **Data Tables**: Reusable table components for Visitors, Hosts, Departments, and Visits
- **Analytics Charts**: Visual representations of visit data and department statistics
- **Form Components**: Reusable form fields with validation
- **Face Verification**: Components for capturing and verifying visitor faces during check-in

### 2. Backend Components

- **API Routes**: RESTful endpoints for all CRUD operations
- **Authentication System**: User session management and role-based access control
- **Database Integration**: MongoDB connection and model definitions
- **Validation Layer**: Request validation using Zod schemas
- **Error Handling**: Standardized error responses
- **Face Recognition Integration**: Services that connect to external face recognition API

### 3. Database Models

- **Visitor**: Stores visitor information including identity details and visit history
- **Host**: Stores host information with authentication credentials and role assignments
- **Department**: Stores department information including location details
- **Visit**: Tracks visit records with status workflow and approval details
- **Notification**: Stores system notifications for users

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────┐
│                         Client Browser                             │
└───────────────────┬───────────────────────────────────┬───────────┘
                    │                                   │
                    ▼                                   ▼
┌───────────────────────────────┐       ┌───────────────────────────┐
│        Next.js Frontend       │       │      Next.js API Routes   │
│                               │       │                           │
│  ┌─────────────────────────┐  │       │  ┌─────────────────────┐  │
│  │ React Components        │  │       │  │ API Controllers     │  │
│  └─────────────────────────┘  │       │  └─────────────────────┘  │
│                               │       │                           │
│  ┌─────────────────────────┐  │       │  ┌─────────────────────┐  │
│  │ State Management        │  │       │  │ Validation Layer    │  │
│  └─────────────────────────┘  │       │  └─────────────────────┘  │
│                               │       │                           │
│  ┌─────────────────────────┐  │       │  ┌─────────────────────┐  │
│  │ Form Handling           │  │       │  │ Authentication      │  │
│  └─────────────────────────┘  │       │  └─────────────────────┘  │
│                               │       │                           │
│  ┌─────────────────────────┐  │       │  ┌─────────────────────┐  │
│  │ UI Components           │  │       │  │ Error Handling      │  │
│  └─────────────────────────┘  │       │  └─────────────────────┘  │
└───────────────────────────────┘       └───────────┬───────────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────────┐
                                        │      Mongoose ODM         │
                                        └───────────┬───────────────┘
                                                    │
                                                    ▼
                                        ┌───────────────────────────┐
                                        │      MongoDB Database     │
                                        └───────────────────────────┘
```

## Authentication Flow

1. User submits login credentials (email/password)
2. NextAuth.js verifies credentials against the database
3. If valid, a JWT session token is created and stored
4. User's role and permissions are encoded in the session
5. Protected routes and components check session status and roles

## Data Flow

1. **Read Operations**:
   - Client sends request to API route
   - Server authenticates and authorizes request
   - Server retrieves data from MongoDB via Mongoose models
   - Server formats response and sends to client
   - Client updates UI with received data

2. **Write Operations**:
   - Client submits form data
   - Client-side validation with Zod schemas
   - Data sent to API route
   - Server validates request data
   - Server authenticates and authorizes request
   - Server performs database operation
   - Server sends success/error response
   - Client updates UI based on response

## Role-Based Access Control

The system implements role-based access control with the following roles:

- **SuperAdmin**: Full system access including department management
- **Admin**: Can manage hosts, visitors, and visits but not departments
- **Host**: Limited to managing visitors and their own visits
- **Regular User**: View-only access to basic information

## Security Considerations

- JWT-based authentication with secure HTTP-only cookies
- Password hashing with bcrypt
- Input validation on both client and server
- MongoDB sanitization to prevent injection attacks
- Role-based access control for all operations
- HTTPS encryption in production

## Error Handling Strategy

The system implements a centralized error handling approach:

- API routes use try-catch blocks with standardized error responses
- Frontend components display appropriate error messages
- Validation errors provide specific feedback for form inputs
- Network errors are handled gracefully with retries when appropriate

## Performance Optimizations

- Server-side pagination for data tables
- Data caching strategies
- Optimized database queries with proper indexing
- Code splitting for better loading performance
- API response compression

## Scalability Considerations

- Stateless API design for horizontal scaling
- Database connection pooling
- Optimized MongoDB indexing strategy
- Serverless architecture for automatic scaling

## External Integrations

### Face Recognition System

The Visitor Management System integrates with an external face recognition API for enhancing security and streamlining the visitor check-in process.

#### Integration Architecture

```
┌─────────────────────┐      ┌─────────────────────────┐
│ Visitor Management  │      │                         │
│      System         │◄────►│  Face Recognition API   │
└─────────────────────┘      │                         │
                             └─────────────────────────┘
```

#### Integration Points

1. **Visit Approval Process**:
   - When a visit is approved, the system automatically registers the visitor's face
   - The visitor's ID is used as the subject ID in the face recognition system
   - Face images are securely transmitted to the recognition API

2. **Check-In/Check-Out Process**:
   - During check-in or check-out, captured face images are sent to the recognition API
   - The API returns similarity scores and matched visitor IDs
   - Results above the 0.9 similarity threshold trigger automatic status updates:
     - For check-in: Status changes from "Approved" to "CheckedIn" and checkInTimestamp is set
     - For check-out: Status changes from "CheckedIn" to "CheckedOut" and checkOutTimestamp is set

#### Technical Details

- **API Base URL**: http://52.66.95.208:8000/api/v1/recognition/
- **Authentication**: x-api-token header for secure communication
- **Endpoints Used**:
  - `/subjects` - For registering visitor IDs
  - `/faces` - For uploading face images
  - `/recognize` - For face verification during check-in

#### Security Considerations

- Base64-encoded images are used for transmission
- API communication is secured via authentication tokens
- Personal data is handled according to privacy regulations
- Face recognition thresholds are set to minimize false positives