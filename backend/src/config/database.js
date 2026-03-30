const mongoose = require('mongoose');

/**
 * Connects to MongoDB using MONGODB_URI from environment.
 * Logs "Database connected" on success.
 */
async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not defined in environment');
  }
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log('Database connected');
}

module.exports = { connectDB };
