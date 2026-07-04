const mongoose = require('mongoose');

// Serverless-safe connection caching. Vercel functions can be invoked
// concurrently and can reuse warm containers, so we cache the connection
// promise on the global object to avoid opening a new connection (and
// exhausting Atlas connection limits) on every invocation.
let cached = global._mongooseConn;
if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => {
        console.log(`MongoDB connected: ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null; // allow retry on next invocation
    console.error(`MongoDB connection error: ${err.message}`);
    // In serverless we must not process.exit — that would crash the function
    // runtime for unrelated concurrent requests. Rethrow instead.
    throw err;
  }

  return cached.conn;
};

module.exports = connectDB;
