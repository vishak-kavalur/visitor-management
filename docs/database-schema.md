# Database Schema Documentation

This document outlines the database schema for the Visitor Management System, which uses MongoDB with Mongoose ODM.

## MongoDB Configuration

The system is configured to connect to a local MongoDB instance:
- **Connection URI**: `mongodb://localhost:27017/visitor-management`
- **Database Name**: `visitor-management`

## Overview

The Visitor Management System database consists of the following collections:
- Visitors
- Hosts
- Departments
- Visits
- Notifications

## Collections

### Visitors Collection

Stores information about visitors who enter the facility.

#### Schema

```javascript
{
  // Unique identifier provided by MongoDB
  _id: ObjectId,
  
  // Aadhaar number of the visitor (unique)
  aadhaarNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Full name of the visitor
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Base64 encoded image of the visitor
  imageBase64: {
    type: String,
    required: true
  },
  
  // Date of first visit
  firstVisit: {
    type: Date,
    required: true
  },
  
  // Date of last visit (updated on each visit)
  lastVisit: {
    type: Date
  },
  
  // When the visitor record was created
  createdTime: {
    type: Date,
    required: true
  },
  
  // Timestamps for document creation and updates
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes
- `aadhaarNumber`: Unique index for faster lookup
- Text index on `fullName` for text search capabilities

#### Methods
- `findByAadhaar`: Find a visitor by Aadhaar number

---

### Hosts Collection

Stores information about hosts who can receive visitors.

#### Schema

```javascript
{
  // Unique identifier provided by MongoDB
  _id: ObjectId,
  
  // Email address of the host (unique)
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  
  // Hashed password for authentication
  password: {
    type: String,
    required: true
  },
  
  // Full name of the host
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  
  // Reference to the department the host belongs to
  departmentId: {
    type: ObjectId,
    ref: 'Department',
    default: null
  },
  
  // Role of the host (SuperAdmin, Admin, or Host)
  role: {
    type: String,
    enum: ['SuperAdmin', 'Admin', 'Host'],
    default: 'Host',
    required: true
  },
  
  // Timestamps for document creation and updates
  createdAt: Date,
  updatedAt: Date
}
```

#### Authentication Note
The system now uses token-based (JWT) authentication without cookies. Tokens are generated based on user credentials and include role and permission information.

#### Indexes
- `email`: Unique index for faster lookup and authentication
- `departmentId`: Index for finding hosts by department
- `role`: Index for filtering hosts by role

#### Methods
- `findByEmail`: Find a host by email address
- `findByDepartment`: Find all hosts in a specific department
- `findByRole`: Find all hosts with a specific role

---

### Departments Collection

Stores information about departments within the organization.

#### Schema

```javascript
{
  // Unique identifier provided by MongoDB
  _id: ObjectId,
  
  // Name of the department (unique)
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  
  // Description of the department
  description: {
    type: String,
    trim: true
  },
  
  // Floor where the department is located
  floor: {
    type: String,
    trim: true
  },
  
  // Building where the department is located
  building: {
    type: String,
    trim: true
  },
  
  // Timestamps for document creation and updates
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes
- Text index on `name` for text search capabilities

#### Methods
- `findByName`: Find a department by name (case-insensitive)
- `getAllSorted`: Get all departments sorted by name
- `hasHosts`: Check if a department has associated hosts
- `hasVisits`: Check if a department has associated visits

---

### Visits Collection

Stores information about visits to the facility.

#### Schema

```javascript
{
  // Unique identifier provided by MongoDB
  _id: ObjectId,
  
  // Current status of the visit
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut'],
    default: 'Pending',
    required: true
  },
  
  // Reference to the visitor making the visit
  visitorId: {
    type: ObjectId,
    ref: 'Visitor',
    required: true
  },
  
  // Reference to the host being visited
  hostId: {
    type: ObjectId,
    ref: 'Host',
    required: true
  },
  
  // Reference to the department being visited
  departmentId: {
    type: ObjectId,
    ref: 'Department',
    required: true
  },
  
  // Purpose of the visit
  purposeOfVisit: {
    type: String,
    required: true,
    trim: true
  },
  
  // When the visit request was submitted
  submissionTimestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  // Approval details
  approval: {
    // Reference to the host/admin who approved the visit
    approvedBy: {
      type: ObjectId,
      ref: 'Host'
    },
    
    // When the visit was approved
    timestamp: {
      type: Date
    }
  },
  
  // When the visitor checked in
  checkInTimestamp: {
    type: Date
  },
  
  // When the visitor checked out
  checkOutTimestamp: {
    type: Date
  },
  
  // Timestamps for document creation and updates
  createdAt: Date,
  updatedAt: Date
}
```

#### Indexes
- `status`: Index for filtering visits by status
- `visitorId`: Index for finding visits by visitor
- `hostId`: Index for finding visits by host
- `departmentId`: Index for finding visits by department
- Compound index on `submissionTimestamp` and `status` for date range queries

#### Methods
- `findPendingVisits`: Find all pending visits, optionally filtered by department

#### Real-time Updates
Visit status changes now trigger real-time notifications through the Socket.IO server running on port 4001.

---

### Notifications Collection

Stores system notifications for users.

#### Schema

```javascript
{
  // Unique identifier provided by MongoDB
  _id: ObjectId,
  
  // Reference to the recipient (Host or Visitor)
  recipientId: {
    type: ObjectId,
    required: true,
    refPath: 'recipientType'
  },
  
  // Type of recipient (determines which collection to reference)
  recipientType: {
    type: String,
    required: true,
    enum: ['Host', 'Visitor']
  },
  
  // Notification message
  message: {
    type: String,
    required: true
  },
  
  // Whether the notification has been read
  isRead: {
    type: Boolean,
    default: false
  },
  
  // Optional reference to a related visit
  relatedVisitId: {
    type: ObjectId,
    ref: 'Visit'
  },
  
  // When the notification was created
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Timestamps for document updates
  updatedAt: Date
}
```

#### Indexes
- Compound index on `recipientId` and `isRead` for finding unread notifications
- `relatedVisitId`: Index for finding notifications related to a visit

#### Methods
- `findUnreadByRecipient`: Find all unread notifications for a recipient

#### Real-time Delivery
Notifications are now delivered in real-time through the Socket.IO server, in addition to being stored in the database.

## Relationships

The collections are related in the following ways:

1. **Host-Department Relationship**:
   - One-to-many: A Department can have multiple Hosts
   - Each Host belongs to one Department (or none)
   - Implemented via `departmentId` reference in the Host document

2. **Visit-Visitor Relationship**:
   - One-to-many: A Visitor can have multiple Visits
   - Each Visit is associated with exactly one Visitor
   - Implemented via `visitorId` reference in the Visit document

3. **Visit-Host Relationship**:
   - One-to-many: A Host can have multiple Visits
   - Each Visit is associated with exactly one Host
   - Implemented via `hostId` reference in the Visit document

4. **Visit-Department Relationship**:
   - One-to-many: A Department can have multiple Visits
   - Each Visit is associated with exactly one Department
   - Implemented via `departmentId` reference in the Visit document

5. **Notification Relationships**:
   - One-to-many: A Host or Visitor can have multiple Notifications
   - Each Notification is associated with exactly one recipient (Host or Visitor)
   - Implemented via `recipientId` and `recipientType` in the Notification document
   - Optional relationship to Visit via `relatedVisitId`

## Mongoose Schemas and Interfaces

The MongoDB collections are managed through Mongoose schemas, which are defined with TypeScript interfaces for type safety. Key interfaces include:

- `IVisitor`, `VisitorDocument`, and `VisitorModel`
- `IHost`, `HostDocument`, and `HostModel`
- `IDepartment`, `DepartmentDocument`, and `DepartmentModel`
- `IVisit`, `VisitDocument`, and `VisitModel`
- `INotification`, `NotificationDocument`, and `NotificationModel`

These interfaces ensure type safety throughout the application when working with database documents.

## Data Integrity

The following measures ensure data integrity:

1. **Referential Integrity**:
   - When attempting to delete a Department, the system checks if there are any associated Hosts or Visits
   - When attempting to delete a Host, the system checks if there are any associated Visits

2. **Unique Constraints**:
   - Unique indexes on `aadhaarNumber` (Visitor), `email` (Host), and `name` (Department)

3. **Required Fields**:
   - Critical fields are marked as required in the schema definition

4. **Validation**:
   - Mongoose schema validation ensures data conforms to expected formats
   - Additional application-level validation using Zod schemas

## Indexing Strategy

The database uses the following indexing strategy for performance optimization:

1. **Primary Keys**:
   - MongoDB automatically indexes the `_id` field for each collection

2. **Unique Fields**:
   - Unique indexes on fields that require uniqueness (`aadhaarNumber`, `email`, `name`)

3. **Foreign Keys**:
   - Indexes on reference fields (`departmentId`, `visitorId`, `hostId`) for faster joins

4. **Frequently Queried Fields**:
   - Indexes on fields commonly used in filters (`status`, `role`)

5. **Text Search**:
   - Text indexes on fields that need text search capabilities (`name`, `fullName`)

6. **Compound Indexes**:
   - Compound indexes for frequently combined query conditions

## Schema Evolution

As the application evolves, the database schema may need to change. The following approaches are used for schema evolution:

1. **Backward Compatibility**:
   - New fields are added with default values or as optional
   - Existing fields are not removed without a migration strategy

2. **Schema Versioning**:
   - Schema changes are versioned and documented

3. **Migration Scripts**:
   - For significant schema changes, migration scripts are provided

## Example Queries

### Find all pending visits for a specific department
```javascript
const pendingVisits = await Visit.find({
  status: 'Pending',
  departmentId: departmentId
}).populate('visitorId hostId');
```

### Find all hosts in a department with Admin role
```javascript
const admins = await Host.find({
  departmentId: departmentId,
  role: 'Admin'
});
```

### Find a visitor's visit history
```javascript
const visitHistory = await Visit.find({
  visitorId: visitorId
}).sort({ submissionTimestamp: -1 });
```

### Get analytics for visits by status
```javascript
const visitStats = await Visit.aggregate([
  {
    $group: {
      _id: '$status',
      count: { $sum: 1 }
    }
  },
  {
    $project: {
      status: '$_id',
      count: 1,
      _id: 0
    }
  }
]);
```

### Find all departments with their host counts
```javascript
const departmentsWithHostCounts = await Department.aggregate([
  {
    $lookup: {
      from: 'hosts',
      localField: '_id',
      foreignField: 'departmentId',
      as: 'hosts'
    }
  },
  {
    $project: {
      name: 1,
      description: 1,
      floor: 1,
      building: 1,
      hostsCount: { $size: '$hosts' }
    }
  }
]);
```

## Socket.IO Integration

The database now integrates with a Socket.IO server running on port 4001 for real-time updates. Key events include:

- Database changes in the `visits` collection trigger Socket.IO events
- Status updates are broadcast to relevant rooms based on department and host IDs
- Notifications are delivered in real-time through Socket.IO in addition to being stored in the database

This integration provides real-time functionality without requiring polling or frequent API requests.