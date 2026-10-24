import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Global cache to maintain a single persistent connection pool across Next.js requests and hot-reloads
declare global {
  // eslint-disable-next-line no-var
  var __OTW_MONGOOSE__: MongooseCache | undefined;
}

const cached: MongooseCache = global.__OTW_MONGOOSE__ ?? { conn: null, promise: null };
global.__OTW_MONGOOSE__ = cached;

const MONGOOSE_OPTIONS: mongoose.ConnectOptions = {
  maxPoolSize: process.env.NODE_ENV === "production" ? 10 : 5, // Keep small in dev to avoid Atlas M0 limits
  minPoolSize: 1,
  maxIdleTimeMS: 30_000,           // Clean up idle connections to avoid exhausting Atlas
  serverSelectionTimeoutMS: 10_000, // Timeout after 10s if cluster is unreachable
  socketTimeoutMS: 45_000,
  connectTimeoutMS: 10_000,
  bufferCommands: true,
  readPreference: "primaryPreferred",
  retryWrites: true,
};

async function connectWithRetry(retries = 2): Promise<typeof mongoose> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI, MONGOOSE_OPTIONS).then((m) => {
          cached.conn = m;
          return m;
        }).catch((err) => {
          cached.conn = null;
          cached.promise = null;
          throw err;
        });
      }
      const conn = await cached.promise;
      return conn;
    } catch (err: any) {
      cached.conn = null;
      cached.promise = null;

      const isRetryable =
        err?.name === "MongoNetworkError" ||
        err?.name === "MongoServerSelectionError" ||
        err?.message?.includes("SSL") ||
        err?.message?.includes("tlsv1 alert internal error");

      if (attempt < retries && isRetryable) {
        console.warn(`[db] Connection attempt ${attempt} failed with transient error (${err?.message || err}). Retrying in 1s...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        continue;
      }
      throw err;
    }
  }
  throw new Error("[db] Failed to connect to MongoDB after retries");
}

async function dbConnect(): Promise<typeof mongoose> {
  // If connection is already healthy and active, reuse immediately with zero overhead
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  return connectWithRetry(2);
}

export default dbConnect;
