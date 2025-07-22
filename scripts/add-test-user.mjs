/**
 * Simple script to add a test user to the database for authentication testing
 * 
 * Run with:
 * node scripts/add-test-user.mjs
 */
import { MongoClient } from 'mongodb';

// MongoDB connection URI - use the same as in .env.local or a default
const uri = 'mongodb://localhost:27017/visitormanagement';

async function addTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    
    console.log('Connected to MongoDB');
    const db = client.db('visitormanagement');
    
    // Create a test host user
    const hostCollection = db.collection('hosts');
    
    // Check if user already exists
    const existingUser = await hostCollection.findOne({ email: 'admin@example.com' });
    
    if (existingUser) {
      console.log('Test user already exists:');
      console.log({
        email: existingUser.email,
        fullName: existingUser.fullName,
        role: existingUser.role,
        _id: existingUser._id.toString()
      });
    } else {
      // Create departments collection if it doesn't exist
      const deptCollection = db.collection('departments');
      
      // Add a test department
      const deptResult = await deptCollection.insertOne({
        name: 'IT Department',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Created test department:', deptResult.insertedId.toString());
      
      // Add the test user
      const result = await hostCollection.insertOne({
        email: 'admin@example.com',
        password: 'password123', // In production, you would hash this
        fullName: 'Admin User',
        departmentId: deptResult.insertedId,
        role: 'SuperAdmin',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Added test user with ID:', result.insertedId.toString());
    }
    
    await client.close();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('Error adding test user:', error);
  }
}

// Run the function
addTestUser();