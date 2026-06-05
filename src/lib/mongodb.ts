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
      maxPoolSize: 10,              // max concurrent DB connections
      serverSelectionTimeoutMS: 5_000,  // fail fast if DB is unreachable
      socketTimeoutMS: 45_000,     // don't hang forever on slow queries
      bufferCommands: false,        // fail immediately if not connected (no silent queuing)
    }).then((m) => {
      if (process.env.NODE_ENV === "development") {
        mongoose.connection.on("connected", () => console.log("[db] connected"));
        mongoose.connection.on("error", (e) => console.error("[db] error", e));
        mongoose.connection.on("disconnected", () => console.warn("[db] disconnected"));
      }
      return m;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;

