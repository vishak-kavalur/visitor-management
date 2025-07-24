/**
 * Seed Data Generator for Visitor Management System
 * 
 * This script populates the database with sample departments, hosts, and visitors
 * for testing and demonstration purposes.
 * 
 * Usage:
 *   node seed-data.js
 */

// const { MongoClient } = require('mongodb');
import { MongoClient } from "mongodb";
import bcrypt from 'bcryptjs';
// const bcrypt = require('bcryptjs');
// const { v4: uuidv4 } = require('uuid');

// Configuration
const MONGODB_URI = 'mongodb://localhost:27017/visitormanagement';
const SALT_ROUNDS = 10;

// Sample data
const departments = [
  { name: 'Administration', description: 'Administrative department', floor: '5th Floor', building: 'Main Building' },
  { name: 'Human Resources', description: 'HR department', floor: '3rd Floor', building: 'Main Building' },
  { name: 'Engineering', description: 'Engineering department', floor: '2nd Floor', building: 'Tech Building' },
  { name: 'Finance', description: 'Finance department', floor: '4th Floor', building: 'Main Building' },
  { name: 'Marketing', description: 'Marketing department', floor: '1st Floor', building: 'Tech Building' },
  { name: 'Research', description: 'R&D department', floor: '3rd Floor', building: 'Tech Building' },
  { name: 'Legal', description: 'Legal department', floor: '6th Floor', building: 'Main Building' },
];

const hostTemplates = [
  { role: 'SuperAdmin', passwordBase: 'SuperAdmin123!' },
  { role: 'Admin', passwordBase: 'Admin123!' },
  { role: 'Host', passwordBase: 'Host123!' },
];

const visitorFirstNames = [
  'John', 'Jane', 'Michael', 'Emma', 'William', 'Olivia', 'James', 'Sophia',
  'Robert', 'Ava', 'David', 'Isabella', 'Joseph', 'Mia', 'Thomas', 'Charlotte',
  'Raj', 'Priya', 'Amit', 'Deepa', 'Sanjay', 'Anita', 'Vikram', 'Meera',
];

const visitorLastNames = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Patel', 'Shah', 'Kumar', 'Singh', 'Sharma', 'Verma', 'Gupta', 'Reddy', 'Iyer',
];

// Generate a random Aadhaar number (for demo purposes only)
function generateAadhaarNumber() {
  let aadhaar = '';
  for (let i = 0; i < 12; i++) {
    aadhaar += Math.floor(Math.random() * 10);
  }
  return aadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
}

// Generate a random base64 image (placeholder for real images)
function generateImageBase64() {
  // This is a very small placeholder image
  return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
}

// Main function to seed the database
async function seedDatabase() {
  let client;

  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI, { useUnifiedTopology: true });
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const departmentsCollection = db.collection('departments');
    const hostsCollection = db.collection('hosts');
    const visitorsCollection = db.collection('visitors');

    // Drop collections to ensure clean slate including all indexes
    try {
      await db.dropCollection('departments');
    } catch (e) {
      console.log('departments collection may not exist, continuing...');
    }
    
    try {
      await db.dropCollection('hosts');
    } catch (e) {
      console.log('hosts collection may not exist, continuing...');
    }
    
    try {
      await db.dropCollection('visitors');
    } catch (e) {
      console.log('visitors collection may not exist, continuing...');
    }
    
    console.log('Cleared existing data');

    // Insert departments
    const departmentResults = await departmentsCollection.insertMany(
      departments.map(dept => ({
        ...dept,
        createdAt: new Date(),
        updatedAt: new Date()
      }))
    );
    console.log(`Added ${departmentResults.insertedCount} departments`);

    // Create hosts for each department
    const departmentIds = Object.values(departmentResults.insertedIds);
    const hosts = [];

    // Create one SuperAdmin (not department-specific)
    hosts.push({
      email: 'superadmin@example.com',
      password: await bcrypt.hash('SuperAdmin123!', SALT_ROUNDS),
      fullName: 'Super Admin',
      departmentId: null,
      role: 'SuperAdmin',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create hosts for each department
    for (const deptId of departmentIds) {
      // One admin per department
      hosts.push({
        email: `admin_${deptId.toString().substring(0, 8)}@example.com`,
        password: await bcrypt.hash('Admin123!', SALT_ROUNDS),
        fullName: 'Department Admin',
        departmentId: deptId,
        role: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 2-3 regular hosts per department
      const numHosts = 2 + Math.floor(Math.random() * 2); // 2 or 3
      for (let i = 0; i < numHosts; i++) {
        hosts.push({
          email: `host_${deptId.toString().substring(0, 5)}_${i}@example.com`,
          password: await bcrypt.hash('Host123!', SALT_ROUNDS),
          fullName: `Host ${i + 1}`,
          departmentId: deptId,
          role: 'Host',
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    }

    const hostResults = await hostsCollection.insertMany(hosts);
    console.log(`Added ${hostResults.insertedCount} hosts`);

    // Create visitors
    const visitors = [];
    const numVisitors = 50; // Change this to generate more or fewer visitors

    for (let i = 0; i < numVisitors; i++) {
      const firstName = visitorFirstNames[Math.floor(Math.random() * visitorFirstNames.length)];
      const lastName = visitorLastNames[Math.floor(Math.random() * visitorLastNames.length)];
      const fullName = `${firstName} ${lastName}`;
      
      const createdTime = new Date();
      createdTime.setDate(createdTime.getDate() - Math.floor(Math.random() * 60)); // Random date in the last 60 days
      
      const firstVisit = new Date(createdTime);
      const lastVisit = Math.random() > 0.3 ? new Date(firstVisit.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null;
      
      visitors.push({
        aadhaarNumber: generateAadhaarNumber(),
        fullName,
        imageBase64: generateImageBase64(),
        firstVisit,
        lastVisit,
        createdTime,
        createdAt: createdTime,
        updatedAt: createdTime
      });
    }

    const visitorResults = await visitorsCollection.insertMany(visitors);
    console.log(`Added ${visitorResults.insertedCount} visitors`);

    // Print login credentials for easy testing
    console.log('\nSample Login Credentials:');
    console.log('SuperAdmin: superadmin@example.com / SuperAdmin123!');
    console.log('Department Admin: Check the database for email addresses');
    console.log('Host: Check the database for email addresses');

    console.log('\nDatabase seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the database connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the seeding function
seedDatabase().catch(console.error);