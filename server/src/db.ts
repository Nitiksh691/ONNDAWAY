import mongoose from "mongoose";
import { config } from "./config/env";
let isConnected = false;

export async function connectDB(): Promise<void> {
  if (isConnected) {
    console.log("✅ MongoDB already connected");
    return;
  }

  const MONGO_URI = config.mongoUri;

  if (!MONGO_URI) {
    console.warn(
      "⚠️  MONGO_URI is not set in server/.env — DB features will not work.\n" +
      "   Copy your MONGODB_URI value from the root .env.local into server/.env as MONGO_URI"
    );
    return; // server still starts, just without DB
  }

  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "onndaway", // same DB as the Next.js app
      readPreference: "primaryPreferred",
    });
    isConnected = true;
    console.log("✅ MongoDB connected successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}
