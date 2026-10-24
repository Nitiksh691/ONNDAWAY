import dotenv from "dotenv";
import path from "path";

dotenv.config();
// Fallback: try reading from workspace root .env.local / .env if server/.env is missing values
dotenv.config({ path: path.resolve(__dirname, "../../../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

export const config = {
  port: parseInt(process.env.PORT || "4000", 10),
  mongoUri: process.env.MONGO_URI || process.env.MONGODB_URI || "",
  nextjsUrl: process.env.NEXTJS_URL || "http://localhost:3000",
  nodeEnv: process.env.NODE_ENV || "development",
  isDev: (process.env.NODE_ENV || "development") === "development",
};
