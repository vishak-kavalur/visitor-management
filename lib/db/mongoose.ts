import mongoose from 'mongoose';

/**
 * Check for required environment variables
 */
if (!process.env.MONGODB_URI) {
  throw new Error('Please add your MongoDB URI to .env.local');
}

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB || 'visitormanagement';

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
const cached = global as typeof global & {
  mongoose?: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
    isConnecting: boolean;
  };
};

/**
 * Initialize the cached mongoose object if it doesn't exist
 */
if (!cached.mongoose) {
  cached.mongoose = {
    conn: null,
    promise: null,
    isConnecting: false
  };
}

/**
 * Configure mongoose connection options for production use
 */
const mongooseOptions = {
  bufferCommands: false,
  autoIndex: true, // Build indexes on schema creation
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 5,  // Maintain at least 5 socket connections
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4, // Use IPv4, skip trying IPv6
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  heartbeatFrequencyMS: 10000, // Heartbeat to check connection (10 seconds)
  retryWrites: true,
  dbName: DB_NAME
};

/**
 * Setup mongoose event listeners for monitoring
 */
function setupMongooseListeners() {
  mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to MongoDB');
  });

  mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('Mongoose disconnected from MongoDB');
    
    // If not already trying to reconnect, attempt reconnection
    if (!cached.mongoose?.isConnecting) {
      console.log('Attempting to reconnect to MongoDB...');
      dbConnect().catch(err => {
        console.error('Mongoose reconnection attempt failed:', err);
      });
    }
  });

  // Handle Node.js process termination and close the Mongoose connection
  process.on('SIGINT', async () => {
    await mongoose.connection.close();
    console.log('Mongoose connection closed due to application termination');
    process.exit(0);
  });
}

/**
 * Connect to MongoDB using Mongoose with connection pooling and error handling
 */
async function dbConnect() {
  // Return existing connection if it's already established
  if (cached.mongoose?.conn) {
    return cached.mongoose.conn;
  }

  // If already connecting, wait for the existing promise
  if (cached.mongoose?.isConnecting) {
    if (cached.mongoose?.promise) {
      try {
        cached.mongoose.conn = await cached.mongoose.promise;
        return cached.mongoose.conn;
      } catch (error) {
        // If error occurs during existing connection attempt, reset and try again
        cached.mongoose.isConnecting = false;
        cached.mongoose.promise = null;
        console.error('Connection error, will retry:', error);
      }
    }
  }

  // Mark as connecting
  cached.mongoose!.isConnecting = true;

  // If no existing connection or connection promise, create a new one
  if (!cached.mongoose?.promise) {
    // Setup mongoose event listeners
    setupMongooseListeners();

    // Set mongoose configuration options
    mongoose.set('strictQuery', true);
    
    // Create connection promise
    cached.mongoose!.promise = mongoose.connect(MONGODB_URI, mongooseOptions)
      .then((mongoose) => {
        console.log(`Connected to MongoDB database: ${DB_NAME}`);
        cached.mongoose!.isConnecting = false;
        return mongoose;
      })
      .catch((error) => {
        cached.mongoose!.isConnecting = false;
        cached.mongoose!.promise = null;
        console.error('Failed to connect to MongoDB:', error);
        throw error;
      });
  }

  // Attempt to resolve the connection
  try {
    cached.mongoose!.conn = await cached.mongoose!.promise;
  } catch (error) {
    cached.mongoose!.promise = null;
    cached.mongoose!.isConnecting = false;
    console.error('Error connecting to database:', error);
    
    // Implement exponential backoff for reconnection
    const backoffDelay = 5000; // 5 seconds
    console.log(`Will retry connection after ${backoffDelay}ms`);
    
    // Set a timeout to try connecting again
    setTimeout(() => {
      console.log('Retrying connection to MongoDB...');
      dbConnect().catch(err => {
        console.error('Mongoose reconnection attempt failed:', err);
      });
    }, backoffDelay);
    
    throw error;
  }

  return cached.mongoose!.conn;
}

/**
 * Manually close the mongoose connection
 */
export async function closeMongooseConnection() {
  if (cached.mongoose?.conn) {
    await mongoose.disconnect();
    cached.mongoose.conn = null;
    cached.mongoose.promise = null;
    cached.mongoose.isConnecting = false;
    console.log('Mongoose connection closed');
  }
}

export default dbConnect;