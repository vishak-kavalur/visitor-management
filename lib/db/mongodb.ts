import { MongoClient, MongoClientOptions, Db, ServerApiVersion } from 'mongodb';

// Check for required environment variable
if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'visitormanagement';

// Connection options with improved settings for production use
const options: MongoClientOptions = {
  maxPoolSize: 10,          // Maintain up to 10 socket connections
  minPoolSize: 5,           // Maintain at least 5 socket connections
  connectTimeoutMS: 10000,  // Give up initial connection after 10 seconds
  socketTimeoutMS: 45000,   // Close sockets after 45 seconds of inactivity
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  serverApi: ServerApiVersion.v1,
  retryWrites: true,
  retryReads: true,
};

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially.
 */
const globalWithMongo = global as typeof globalThis & {
  _mongoClient?: MongoClient;
  _mongoClientPromise?: Promise<MongoClient>;
  _mongoDB?: Db;
};

// Connection management
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable to preserve connection
  // across module reloads caused by HMR
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    
    // Set up connection event handlers
    client.on('connectionCreated', () => {
      console.log('MongoDB connection created');
    });
    
    client.on('connectionClosed', () => {
      console.log('MongoDB connection closed');
    });
    
    client.on('error', (error) => {
      console.error('MongoDB connection error:', error);
      // Attempt reconnection on error
      setTimeout(() => {
        console.log('Attempting to reconnect to MongoDB...');
        client.connect().catch(err => {
          console.error('Reconnection attempt failed:', err);
        });
      }, 5000);
    });
    
    globalWithMongo._mongoClient = client;
    globalWithMongo._mongoClientPromise = client.connect();
    
    // Initialize database
    globalWithMongo._mongoClientPromise.then(client => {
      globalWithMongo._mongoDB = client.db(dbName);
      console.log(`Connected to MongoDB database: ${dbName}`);
    }).catch(err => {
      console.error('Failed to connect to MongoDB:', err);
    });
  }
  
  client = globalWithMongo._mongoClient!;
  clientPromise = globalWithMongo._mongoClientPromise!;
} else {
  // In production mode, create a new connection for each instance
  client = new MongoClient(uri, options);
  
  // Set up connection event handlers
  client.on('connectionCreated', () => {
    console.log('MongoDB connection created');
  });
  
  client.on('connectionClosed', () => {
    console.log('MongoDB connection closed');
  });
  
  client.on('error', (error) => {
    console.error('MongoDB connection error:', error);
    // Attempt reconnection on error
    setTimeout(() => {
      console.log('Attempting to reconnect to MongoDB...');
      client.connect().catch(err => {
        console.error('Reconnection attempt failed:', err);
      });
    }, 5000);
  });
  
  clientPromise = client.connect();
}

/**
 * Get a database instance
 * @returns Promise resolving to MongoDB Db instance
 */
export async function getDatabase(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

/**
 * Close the database connection
 */
export async function closeDatabase(): Promise<void> {
  const client = await clientPromise;
  await client.close();
  console.log('MongoDB connection closed');
}

// Export module-scoped MongoClient promise and helper functions
export default clientPromise;