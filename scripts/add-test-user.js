/**
 * Script to add a test user to the database
 */
import { MongoClient } from 'mongodb';

async function addTestUser() {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/visitormanagement';
    const client = new MongoClient(uri);
    await client.connect();
    
    console.log('Connected to MongoDB');
    const db = client.db();
    
    // Create a test host user
    const hostCollection = db.collection('hosts');
    
    // Check if user already exists
    const existingUser = await hostCollection.findOne({ email: 'admin@example.com' });
    
    if (existingUser) {
      console.log('Test user already exists');
    } else {
      // Create departments collection if it doesn't exist
      const deptCollection = db.collection('departments');
      
      // Add a test department
      const deptResult = await deptCollection.insertOne({
        name: 'IT Department',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Created test department');
      
      // Add the test user
      const result = await hostCollection.insertOne({
        email: 'admin@example.com',
        password: 'password123',
        fullName: 'Admin User',
        role: 'SuperAdmin',
        departmentId: deptResult.insertedId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Added test user with ID:', result.insertedId);
    }
    
    await client.close();
    console.log('Done');
    
  } catch (error) {
    console.error('Error adding test user:', error);
  }
}

// Run the function
addTestUser();