// MongoDB initialization script for Docker deployment
// This script will be executed when the MongoDB container is first created

// Connect to the database
db = db.getSiblingDB('visitor_management');

// Create collections with validation
db.createCollection('departments', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name'],
      properties: {
        name: { bsonType: 'string' },
        description: { bsonType: 'string' },
        floor: { bsonType: 'string' },
        building: { bsonType: 'string' }
      }
    }
  }
});

db.createCollection('hosts', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password', 'fullName', 'role'],
      properties: {
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        fullName: { bsonType: 'string' },
        departmentId: { bsonType: ['objectId', 'null'] },
        role: { enum: ['SuperAdmin', 'Admin', 'Host'] }
      }
    }
  }
});

db.createCollection('visitors', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['aadhaarNumber', 'fullName', 'imageBase64', 'firstVisit', 'createdTime'],
      properties: {
        aadhaarNumber: { bsonType: 'string' },
        fullName: { bsonType: 'string' },
        imageBase64: { bsonType: 'string' },
        firstVisit: { bsonType: 'date' },
        lastVisit: { bsonType: 'date' },
        createdTime: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('visits', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['status', 'visitorId', 'hostId', 'departmentId', 'purposeOfVisit', 'submissionTimestamp'],
      properties: {
        status: { enum: ['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut'] },
        visitorId: { bsonType: 'objectId' },
        hostId: { bsonType: 'objectId' },
        departmentId: { bsonType: 'objectId' },
        purposeOfVisit: { bsonType: 'string' },
        submissionTimestamp: { bsonType: 'date' },
        approval: {
          bsonType: 'object',
          properties: {
            approvedBy: { bsonType: 'objectId' },
            timestamp: { bsonType: 'date' }
          }
        },
        checkInTimestamp: { bsonType: 'date' },
        checkOutTimestamp: { bsonType: 'date' }
      }
    }
  }
});

db.createCollection('notifications', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['recipientId', 'recipientType', 'message', 'isRead', 'createdAt'],
      properties: {
        recipientId: { bsonType: 'objectId' },
        recipientType: { enum: ['Host', 'Visitor'] },
        message: { bsonType: 'string' },
        isRead: { bsonType: 'bool' },
        relatedVisitId: { bsonType: 'objectId' },
        createdAt: { bsonType: 'date' }
      }
    }
  }
});

// Create indexes

// Visitors collection
db.visitors.createIndex({ aadhaarNumber: 1 }, { unique: true });
db.visitors.createIndex({ fullName: "text" });

// Hosts collection
db.hosts.createIndex({ email: 1 }, { unique: true });
db.hosts.createIndex({ departmentId: 1 });
db.hosts.createIndex({ role: 1 });

// Departments collection
db.departments.createIndex({ name: 1 }, { unique: true });
db.departments.createIndex({ name: "text" });

// Visits collection
db.visits.createIndex({ status: 1 });
db.visits.createIndex({ visitorId: 1 });
db.visits.createIndex({ hostId: 1 });
db.visits.createIndex({ departmentId: 1 });
db.visits.createIndex({ submissionTimestamp: 1, status: 1 });

// Notifications collection
db.notifications.createIndex({ recipientId: 1, isRead: 1 });
db.notifications.createIndex({ relatedVisitId: 1 });

// Create default SuperAdmin user if no users exist
if (db.hosts.countDocuments() === 0) {
  // Using a pre-hashed password for "Admin@123" - in production, use a proper password hashing mechanism
  const hashedPassword = '$2b$10$aBcDeFgHiJkLmNoPqRsTuVwXyZ0123456789abcdefghijklm';
  
  db.hosts.insertOne({
    email: 'admin@example.com',
    password: hashedPassword,
    fullName: 'System Administrator',
    departmentId: null,
    role: 'SuperAdmin',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  print('Default SuperAdmin user created');
}

// Create default Department if no departments exist
if (db.departments.countDocuments() === 0) {
  db.departments.insertOne({
    name: 'Administration',
    description: 'Main administrative department',
    floor: '1st Floor',
    building: 'Main Building',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  print('Default Administration department created');
}

print('MongoDB initialization completed successfully');