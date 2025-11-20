import mongoose from "mongoose";

/**
 * Establishes MongoDB connection with retry logic and event handlers
 * 
 * Implements production-ready database connection with:
 * - Automatic retry on failure (3 attempts with 5s delay)
 * - Connection pooling for performance
 * - Event handlers for disconnections
 * - Process termination on fatal errors
 * 
 * @async
 * @throws {Error} Terminates process if connection fails after retries
 * 
 * @performance Connection pooling (min: 2, max: 10) reduces overhead
 * @reliability Retry logic handles transient network failures
 */
export const connectDB = async () => {
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 5000; // 5 seconds

  const connectionOptions = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10, // Connection pooling for performance
    minPoolSize: 2,
  };

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const conn = await mongoose.connect(
        process.env.MONGODB_URI,
        connectionOptions
      );

      console.log(`✓ MongoDB connected: ${conn.connection.host}`);

      // Handle connection events for monitoring
      mongoose.connection.on('disconnected', () => {
        console.error('⚠ MongoDB disconnected. Attempting to reconnect...');
      });

      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✓ MongoDB reconnected');
      });

      return conn;
    } catch (error) {
      console.error(
        `MongoDB connection attempt ${attempt}/${MAX_RETRIES} failed:`,
        error.message
      );

      if (attempt === MAX_RETRIES) {
        console.error('FATAL: Could not connect to MongoDB after retries');
        console.error('Application cannot function without database. Exiting...');
        process.exit(1); // Terminate - cannot operate without database
      }

      // Wait before retry
      console.log(`Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
    }
  }
};

