import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable in .env.local");
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Typed global cache — prevents multiple connections during hot reload in dev
declare global {
  // eslint-disable-next-line no-var
  var __OTW_MONGOOSE__: MongooseCache | undefined;
}

const cached: MongooseCache = global.__OTW_MONGOOSE__ ?? { conn: null, promise: null };
global.__OTW_MONGOOSE__ = cached;

async function dbConnect(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10_000, // increased from 5s for reliability
      socketTimeoutMS: 45_000,
      connectTimeoutMS: 10_000,
      bufferCommands: true,             // allow queuing so idle reconnects work
    }).then((m) => {
      if (process.env.NODE_ENV === "development") {
        mongoose.connection.on("connected", () => console.log("[db] connected"));
        mongoose.connection.on("error", (e) => {
          console.error("[db] error", e);
          // Reset cache so next request triggers a fresh connect
          cached.conn = null;
          cached.promise = null;
        });
        mongoose.connection.on("disconnected", () => {
          console.warn("[db] disconnected — will reconnect on next request");
          cached.conn = null;
          cached.promise = null;
        });
      } else {
        mongoose.connection.on("error", () => { cached.conn = null; cached.promise = null; });
        mongoose.connection.on("disconnected", () => { cached.conn = null; cached.promise = null; });
      }
      return m;
    }).catch((err) => {
      // Reset so next call retries
      cached.promise = null;
      throw err;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;

