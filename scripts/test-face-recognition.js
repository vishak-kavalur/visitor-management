/**
 * Face Recognition Test Script
 *
 * This script tests the face recognition functionality in the visitor management system:
 * 1. Tests face upload during visit approval
 * 2. Tests face verification for check-in (matching and non-matching cases)
 * 3. Tests face verification for check-out (matching and non-matching cases)
 * 4. Tests status validation for both check-in and check-out operations
 *
 * Usage:
 *   node test-face-recognition.js
 */

import fetch from 'node-fetch';
import { MongoClient, ObjectId } from 'mongodb';

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3000/api',
  mongodb: {
    uri: 'mongodb://localhost:27017/visitormanagement',
    options: { useUnifiedTopology: true }
  },
  // Minimum similarity threshold for face match (from facematch/route.ts)
  similarityThreshold: 0.9
};

// Test face images (Base64 encoded) - using a tiny sample image for demonstration
// In a real scenario, you'd use actual face images
const TEST_FACES = {
  // This would be the same as visitor's face
  matching: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  // This would be a different face
  nonMatching: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
};

// Mock admin user for authentication (would use real authentication in production)
const MOCK_ADMIN = {
  id: '000000000000000000000001',
  role: 'Admin'
};

/**
 * Connect to MongoDB
 */
async function connectToMongoDB() {
  try {
    const client = new MongoClient(CONFIG.mongodb.uri, CONFIG.mongodb.options);
    await client.connect();
    console.log('Connected to MongoDB');
    return client;
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Find or create a test visitor with an image
 */
async function findOrCreateTestVisitor(db) {
  console.log('\n--- SETTING UP TEST VISITOR ---');
  
  try {
    const visitorsCollection = db.collection('visitors');
    
    // Try to find an existing visitor with an image
    const existingVisitor = await visitorsCollection.findOne({ 
      imageBase64: { $exists: true, $ne: null } 
    });
    
    if (existingVisitor) {
      console.log(`Using existing visitor: ${existingVisitor.fullName} (ID: ${existingVisitor._id})`);
      return existingVisitor;
    }
    
    // Create a new test visitor
    const newVisitor = {
      aadhaarNumber: '1234-5678-9012',
      fullName: 'Test Face Recognition Visitor',
      imageBase64: TEST_FACES.matching,
      firstVisit: new Date(),
      createdTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await visitorsCollection.insertOne(newVisitor);
    newVisitor._id = result.insertedId;
    
    console.log(`Created new test visitor with ID: ${newVisitor._id}`);
    return newVisitor;
  } catch (error) {
    console.error('Error finding/creating test visitor:', error);
    throw error;
  }
}

/**
 * Create a visit request for testing
 */
async function createTestVisit(db, visitorId) {
  console.log('\n--- CREATING TEST VISIT ---');
  
  try {
    // Find a host (preferably with Admin role for approving)
    const hostsCollection = db.collection('hosts');
    const host = await hostsCollection.findOne({ role: 'Admin' });
    
    if (!host) {
      throw new Error('No admin host found in the database');
    }
    
    // Find a department
    const departmentsCollection = db.collection('departments');
    const department = await departmentsCollection.findOne({});
    
    if (!department) {
      throw new Error('No department found in the database');
    }
    
    // Create a visit
    const visitsCollection = db.collection('visits');
    const newVisit = {
      status: 'Pending',
      visitorId: new ObjectId(visitorId),
      hostId: host._id,
      departmentId: department._id,
      purposeOfVisit: 'Face Recognition Testing',
      submissionTimestamp: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await visitsCollection.insertOne(newVisit);
    newVisit._id = result.insertedId;
    
    console.log(`Created test visit with ID: ${newVisit._id}`);
    return { visit: newVisit, host, department };
  } catch (error) {
    console.error('Error creating test visit:', error);
    throw error;
  }
}

/**
 * Test face upload during visit approval
 */
async function testFaceUploadDuringApproval(visitId, hostId) {
  console.log('\n--- TESTING FACE UPLOAD DURING VISIT APPROVAL ---');
  
  try {
    // Approve the visit (which should trigger face registration)
    const response = await fetch(`${CONFIG.baseUrl}/visits/${visitId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // In a real scenario, you would use authentication
        'x-mock-user-id': hostId.toString(),
        'x-mock-user-role': 'Admin'
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`Failed to approve visit: ${data.error || response.statusText}`);
    }
    
    console.log('Visit approval response:', data);
    
    if (data.success) {
      console.log('✅ Visit approved successfully');
      console.log('Face registration should have been triggered in the background');
      
      // In a real test, we might want to wait briefly for the face registration to complete
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return true;
    } else {
      console.log('❌ Visit approval failed');
      return false;
    }
  } catch (error) {
    console.error('Error testing face upload during approval:', error);
    return false;
  }
}

/**
 * Test face verification for check-in with matching face (visit status: Approved)
 */
async function testCheckInWithMatch(visitorId) {
  console.log('\n--- TESTING CHECK-IN WITH MATCHING FACE ---');
  
  try {
    // Send matching face for verification with CHECKIN type
    const response = await fetch(`${CONFIG.baseUrl}/visits/facematch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: TEST_FACES.matching,
        type: 'CHECKIN'
      })
    });
    
    const data = await response.json();
    console.log('Check-in face verification response:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Check-in face verification with matching face succeeded');
      
      // Verify that the returned visitor ID matches our test visitor
      if (data.data?.visitor?.id === visitorId.toString()) {
        console.log('✅ Returned visitor ID matches test visitor');
      } else {
        console.log('❌ Returned visitor ID does not match test visitor');
        console.log(`  Expected: ${visitorId}`);
        console.log(`  Actual: ${data.data?.visitor?.id}`);
      }
      
      // Verify that visit status was updated to CheckedIn
      if (data.data?.visit?.status === 'CheckedIn') {
        console.log('✅ Visit status updated to CheckedIn');
      } else {
        console.log('❌ Visit status not updated to CheckedIn');
      }
      
      // Verify similarity is above threshold
      if (data.data?.similarity >= CONFIG.similarityThreshold) {
        console.log(`✅ Similarity (${data.data.similarity}) is above threshold (${CONFIG.similarityThreshold})`);
      } else {
        console.log(`❌ Similarity (${data.data.similarity}) is below threshold (${CONFIG.similarityThreshold})`);
      }
      
      // Verify checkInTimestamp is set
      if (data.data?.visit?.checkInTime) {
        console.log('✅ Check-in timestamp is set');
      } else {
        console.log('❌ Check-in timestamp is not set');
      }
      
      return true;
    } else {
      console.log('❌ Check-in face verification with matching face failed');
      console.log(`Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('Error testing check-in face verification with match:', error);
    return false;
  }
}

/**
 * Test face verification for check-out with matching face (visit status: CheckedIn)
 */
async function testCheckOutWithMatch(visitorId) {
  console.log('\n--- TESTING CHECK-OUT WITH MATCHING FACE ---');
  
  try {
    // Send matching face for verification with CHECKOUT type
    const response = await fetch(`${CONFIG.baseUrl}/visits/facematch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: TEST_FACES.matching,
        type: 'CHECKOUT'
      })
    });
    
    const data = await response.json();
    console.log('Check-out face verification response:', data);
    
    if (response.ok && data.success) {
      console.log('✅ Check-out face verification with matching face succeeded');
      
      // Verify that the returned visitor ID matches our test visitor
      if (data.data?.visitor?.id === visitorId.toString()) {
        console.log('✅ Returned visitor ID matches test visitor');
      } else {
        console.log('❌ Returned visitor ID does not match test visitor');
        console.log(`  Expected: ${visitorId}`);
        console.log(`  Actual: ${data.data?.visitor?.id}`);
      }
      
      // Verify that visit status was updated to CheckedOut
      if (data.data?.visit?.status === 'CheckedOut') {
        console.log('✅ Visit status updated to CheckedOut');
      } else {
        console.log('❌ Visit status not updated to CheckedOut');
      }
      
      // Verify similarity is above threshold
      if (data.data?.similarity >= CONFIG.similarityThreshold) {
        console.log(`✅ Similarity (${data.data.similarity}) is above threshold (${CONFIG.similarityThreshold})`);
      } else {
        console.log(`❌ Similarity (${data.data.similarity}) is below threshold (${CONFIG.similarityThreshold})`);
      }
      
      // Verify checkOutTimestamp is set
      if (data.data?.visit?.checkOutTime) {
        console.log('✅ Check-out timestamp is set');
      } else {
        console.log('❌ Check-out timestamp is not set');
      }
      
      return true;
    } else {
      console.log('❌ Check-out face verification with matching face failed');
      console.log(`Error: ${data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error('Error testing check-out face verification with match:', error);
    return false;
  }
}

/**
 * Test face verification for check-in with non-matching face
 */
async function testCheckInWithNonMatch() {
  console.log('\n--- TESTING CHECK-IN WITH NON-MATCHING FACE ---');
  
  try {
    // Send non-matching face for verification with CHECKIN type
    const response = await fetch(`${CONFIG.baseUrl}/visits/facematch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: TEST_FACES.nonMatching,
        type: 'CHECKIN'
      })
    });
    
    const data = await response.json();
    console.log('Check-in face verification response:', data);
    
    // Non-matches return 500 status with "NO match found"
    if (response.status === 500 && data.error === 'NO match found') {
      console.log('✅ Non-matching face correctly rejected for check-in');
      return true;
    } else {
      console.log('❌ Non-matching face test for check-in failed');
      console.log('Expected 500 status with "NO match found" error');
      return false;
    }
  } catch (error) {
    console.error('Error testing check-in with non-matching face:', error);
    return false;
  }
}

/**
 * Test face verification for check-out with non-matching face
 */
async function testCheckOutWithNonMatch() {
  console.log('\n--- TESTING CHECK-OUT WITH NON-MATCHING FACE ---');
  
  try {
    // Send non-matching face for verification with CHECKOUT type
    const response = await fetch(`${CONFIG.baseUrl}/visits/facematch`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        imageBase64: TEST_FACES.nonMatching,
        type: 'CHECKOUT'
      })
    });
    
    const data = await response.json();
    console.log('Check-out face verification response:', data);
    
    // Non-matches return 500 status with "NO match found"
    if (response.status === 500 && data.error === 'NO match found') {
      console.log('✅ Non-matching face correctly rejected for check-out');
      return true;
    } else {
      console.log('❌ Non-matching face test for check-out failed');
      console.log('Expected 500 status with "NO match found" error');
      return false;
    }
  } catch (error) {
    console.error('Error testing check-out with non-matching face:', error);
    return false;
  }
}

/**
 * Test check-in with invalid visit status (non-Approved)
 */
async function testCheckInWithInvalidStatus() {
  console.log('\n--- TESTING CHECK-IN WITH INVALID VISIT STATUS ---');
  
  try {
    // Mock update visit status to something other than Approved
    let client;
    try {
      client = await connectToMongoDB();
      const db = client.db();
      
      // Find the most recent approved visit
      const visitsCollection = db.collection('visits');
      const visit = await visitsCollection.findOne({ status: 'Approved' });
      
      if (!visit) {
        console.log('❌ No Approved visit found for testing invalid status');
        return false;
      }
      
      // Change status to something invalid for check-in
      await visitsCollection.updateOne(
        { _id: visit._id },
        { $set: { status: 'Pending' } }
      );
      
      console.log(`Updated visit status to Pending for ID: ${visit._id}`);
      
      // Get visitor ID for this visit
      const visitor = await db.collection('visitors').findOne({ _id: visit.visitorId });
      
      if (!visitor) {
        console.log('❌ No visitor found for this visit');
        return false;
      }
      
      // Try to check in with matching face but invalid status
      const response = await fetch(`${CONFIG.baseUrl}/visits/facematch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: TEST_FACES.matching,
          type: 'CHECKIN'
        })
      });
      
      const data = await response.json();
      console.log('Check-in with invalid status response:', data);
      
      // Should reject with a 404 and appropriate message
      if (response.status === 404 && data.error.includes('No approved visit found')) {
        console.log('✅ Check-in with invalid status correctly rejected');
        return true;
      } else {
        console.log('❌ Check-in with invalid status test failed');
        console.log('Expected 404 status with "No approved visit found" error');
        return false;
      }
      
    } finally {
      if (client) await client.close();
    }
    
  } catch (error) {
    console.error('Error testing check-in with invalid status:', error);
    return false;
  }
}

/**
 * Test check-out with invalid visit status (non-CheckedIn)
 */
async function testCheckOutWithInvalidStatus() {
  console.log('\n--- TESTING CHECK-OUT WITH INVALID VISIT STATUS ---');
  
  try {
    // Mock update visit status to something other than CheckedIn
    let client;
    try {
      client = await connectToMongoDB();
      const db = client.db();
      
      // Find the most recent checked-in visit
      const visitsCollection = db.collection('visits');
      const visit = await visitsCollection.findOne({ status: 'CheckedIn' });
      
      if (!visit) {
        console.log('❌ No CheckedIn visit found for testing invalid status');
        return false;
      }
      
      // Change status to something invalid for check-out
      await visitsCollection.updateOne(
        { _id: visit._id },
        { $set: { status: 'Approved' } }
      );
      
      console.log(`Updated visit status to Approved for ID: ${visit._id}`);
      
      // Get visitor ID for this visit
      const visitor = await db.collection('visitors').findOne({ _id: visit.visitorId });
      
      if (!visitor) {
        console.log('❌ No visitor found for this visit');
        return false;
      }
      
      // Try to check out with matching face but invalid status
      const response = await fetch(`${CONFIG.baseUrl}/visits/facematch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: TEST_FACES.matching,
          type: 'CHECKOUT'
        })
      });
      
      const data = await response.json();
      console.log('Check-out with invalid status response:', data);
      
      // Should reject with a 404 and appropriate message
      if (response.status === 404 && data.error.includes('No checked-in visit found')) {
        console.log('✅ Check-out with invalid status correctly rejected');
        return true;
      } else {
        console.log('❌ Check-out with invalid status test failed');
        console.log('Expected 404 status with "No checked-in visit found" error');
        return false;
      }
      
    } finally {
      if (client) await client.close();
    }
    
  } catch (error) {
    console.error('Error testing check-out with invalid status:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  let client;
  let testResults = {
    faceUpload: false,
    checkInWithMatch: false,
    checkInWithNonMatch: false,
    checkOutWithMatch: false,
    checkOutWithNonMatch: false,
    checkInWithInvalidStatus: false,
    checkOutWithInvalidStatus: false
  };
  
  try {
    console.log('=== FACE RECOGNITION INTEGRATION TESTS ===');
    console.log(`Testing against API: ${CONFIG.baseUrl}`);
    
    // Connect to MongoDB
    client = await connectToMongoDB();
    const db = client.db();
    
    // Find or create a test visitor
    const visitor = await findOrCreateTestVisitor(db);
    
    // Create a test visit for the visitor
    const { visit, host } = await createTestVisit(db, visitor._id);
    
    // Test face upload during visit approval
    testResults.faceUpload = await testFaceUploadDuringApproval(visit._id, host._id);
    
    // Test face verification for check-in with matching face
    testResults.checkInWithMatch = await testCheckInWithMatch(visitor._id);
    
    // Test face verification for check-in with non-matching face
    testResults.checkInWithNonMatch = await testCheckInWithNonMatch();
    
    // Test face verification for check-out with matching face
    // This depends on successful check-in
    if (testResults.checkInWithMatch) {
      testResults.checkOutWithMatch = await testCheckOutWithMatch(visitor._id);
    } else {
      console.log('\n❌ Skipping check-out test since check-in failed');
      testResults.checkOutWithMatch = false;
    }
    
    // Test face verification for check-out with non-matching face
    testResults.checkOutWithNonMatch = await testCheckOutWithNonMatch();
    
    // Test check-in with invalid status
    testResults.checkInWithInvalidStatus = await testCheckInWithInvalidStatus();
    
    // Test check-out with invalid status
    testResults.checkOutWithInvalidStatus = await testCheckOutWithInvalidStatus();
    
    // Print test summary
    console.log('\n=== TEST SUMMARY ===');
    console.log(`Face Upload During Approval: ${testResults.faceUpload ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Check-in with Matching Face: ${testResults.checkInWithMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Check-in with Non-Matching Face: ${testResults.checkInWithNonMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Check-out with Matching Face: ${testResults.checkOutWithMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Check-out with Non-Matching Face: ${testResults.checkOutWithNonMatch ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Check-in with Invalid Status: ${testResults.checkInWithInvalidStatus ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Check-out with Invalid Status: ${testResults.checkOutWithInvalidStatus ? '✅ PASS' : '❌ FAIL'}`);
    
    const overallResult = Object.values(testResults).every(result => result);
    console.log(`\nOverall Result: ${overallResult ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
    
  } catch (error) {
    console.error('Test execution error:', error);
  } finally {
    // Close MongoDB connection
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the tests
runTests().catch(console.error);