import express, { Application } from "express";
import cors from "cors";
import { config } from "./config/env";
import routes from "./routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

import mongoose from "mongoose";
import { connectDB } from "./db";

const app: Application = express();

// ─── Core Middleware ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [config.nextjsUrl, "http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
  })
);

// Auto-connect to MongoDB if idle or not connected yet
app.use(async (_req, _res, next) => {
  if (mongoose.connection.readyState === 0) {
    try {
      await connectDB();
    } catch {
      // ignore
    }
  }
  next();
});

// ─── Root ────────────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    message: "🚀 Onndaway Node.js Server",
    docs: {
      health: "GET /api/health",
      pingNextjs: "GET /api/ping-nextjs",
    },
  });
});

// ─── API Routes ──────────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── Error Handlers (must be last) ───────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

export default app;
