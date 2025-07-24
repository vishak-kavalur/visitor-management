/**
 * Visit Data Generator for Visitor Management System
 * 
 * This script generates sample visits that connect visitors, hosts, and departments.
 * Run this script after seed-data.js to create a complete test dataset.
 * 
 * Usage:
 *   node seed-visits.js
 */

import { MongoClient, ObjectId } from 'mongodb';

// Configuration
const MONGODB_URI = 'mongodb://localhost:27017/visitormanagement';

// Visit status options
const visitStatuses = ['Pending', 'Approved', 'Rejected', 'CheckedIn', 'CheckedOut'];
const visitPurposes = [
  'Interview', 'Business Meeting', 'Consultation', 'Product Demo',
  'Service Maintenance', 'Delivery', 'Training Session', 'Project Discussion',
  'Audit', 'Client Meeting', 'Vendor Meeting', 'Conference'
];

// Helper function to get random element from array
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get random date in the past 60 days
const getRandomPastDate = (maxDaysAgo = 60) => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * maxDaysAgo));
  date.setHours(Math.floor(Math.random() * 12) + 8); // Between 8AM and 8PM
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(Math.floor(Math.random() * 60));
  return date;
};

// Helper function to get a date after another date (for checkout after checkin)
const getRandomFutureDate = (baseDate, maxHoursLater = 8) => {
  const date = new Date(baseDate);
  date.setTime(date.getTime() + (Math.random() * maxHoursLater * 60 * 60 * 1000));
  return date;
};

// Main function to seed visits
async function seedVisits() {
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
    const visitsCollection = db.collection('visits');

    // Fetch existing data
    const departments = await departmentsCollection.find({}).toArray();
    const hosts = await hostsCollection.find({}).toArray();
    const visitors = await visitorsCollection.find({}).toArray();

    if (!departments.length || !hosts.length || !visitors.length) {
      console.error('No departments, hosts, or visitors found. Run seed-data.js first.');
      return;
    }

    console.log(`Found ${departments.length} departments, ${hosts.length} hosts, and ${visitors.length} visitors`);

    // Drop visits collection to ensure clean slate including all indexes
    try {
      await db.dropCollection('visits');
      console.log('Dropped existing visits collection');
    } catch (e) {
      console.log('visits collection may not exist, continuing...');
    }
    
    console.log('Cleared existing visits');

    const visits = [];
    const numVisits = 200; // Change this to generate more or fewer visits
    const now = new Date();

    // Find admins and hosts for approvals
    const approvers = hosts.filter(host => ['Admin', 'SuperAdmin'].includes(host.role));

    for (let i = 0; i < numVisits; i++) {
      // Select random visitor, host, and department
      const visitor = getRandomElement(visitors);
      const host = getRandomElement(hosts.filter(h => h.role === 'Host')); // Only regular hosts, not admins
      const department = departments.find(d => d._id.toString() === host.departmentId?.toString()) || 
                        getRandomElement(departments);

      // Generate submission timestamp
      const submissionTimestamp = getRandomPastDate();
      
      // Randomly determine visit status
      const status = getRandomElement(visitStatuses);
      
      // Create base visit object
      const visit = {
        status,
        visitorId: visitor._id,
        hostId: host._id,
        departmentId: department._id,
        purposeOfVisit: getRandomElement(visitPurposes),
        submissionTimestamp,
        createdAt: submissionTimestamp,
        updatedAt: submissionTimestamp
      };

      // Add status-specific data
      if (['Approved', 'CheckedIn', 'CheckedOut'].includes(status)) {
        const approver = getRandomElement(approvers);
        const approvalTime = new Date(submissionTimestamp);
        approvalTime.setTime(approvalTime.getTime() + Math.random() * 48 * 60 * 60 * 1000); // 0-48 hours after submission
        
        visit.approval = {
          approvedBy: approver._id,
          timestamp: approvalTime
        };
        
        visit.updatedAt = approvalTime;
      }

      if (['CheckedIn', 'CheckedOut'].includes(status)) {
        const checkInTime = new Date(visit.approval.timestamp);
        checkInTime.setTime(checkInTime.getTime() + Math.random() * 24 * 60 * 60 * 1000); // 0-24 hours after approval
        visit.checkInTimestamp = checkInTime;
        visit.updatedAt = checkInTime;
      }

      if (status === 'CheckedOut') {
        const checkOutTime = getRandomFutureDate(visit.checkInTimestamp, 8); // 0-8 hours after check-in
        visit.checkOutTimestamp = checkOutTime;
        visit.updatedAt = checkOutTime;
      }

      visits.push(visit);
    }

    const visitResults = await visitsCollection.insertMany(visits);
    console.log(`Added ${visitResults.insertedCount} visits`);

    // Generate distribution statistics
    const statusCounts = {};
    visits.forEach(visit => {
      statusCounts[visit.status] = (statusCounts[visit.status] || 0) + 1;
    });

    console.log('\nVisit Status Distribution:');
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`${status}: ${count} (${Math.round(count / visits.length * 100)}%)`);
    });

    console.log('\nVisit data seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding visits:', error);
  } finally {
    // Close the database connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the seeding function
seedVisits().catch(console.error);