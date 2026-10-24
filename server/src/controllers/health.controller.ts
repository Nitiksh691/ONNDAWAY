import { Request, Response } from "express";
import mongoose from "mongoose";
import { config } from "../config/env";
import { ApiResponse, HealthStatus, PingResult } from "../types";

// GET /api/health
export const getHealth = (_req: Request, res: Response): void => {
  const dbState = mongoose.connection.readyState;
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const dbStatus = dbState === 1 ? "connected" : "disconnected";
  const overallStatus = dbState === 1 ? "ok" : "degraded";

  const body: ApiResponse<HealthStatus> = {
    success: true,
    data: {
      status: overallStatus,
      service: "onndaway-node-server",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      uptime: Math.floor(process.uptime()),
      db: dbStatus,
      environment: config.nodeEnv,
    },
  };

  res.status(200).json(body);
};

// GET /api/ping-nextjs
export const pingNextjs = async (_req: Request, res: Response): Promise<void> => {
  const start = Date.now();

  try {
    const response = await fetch(`${config.nextjsUrl}/api/health`);
    const responseTimeMs = Date.now() - start;
    let nextjsResponse: unknown;

    try {
      nextjsResponse = await response.json();
    } catch {
      nextjsResponse = { status: response.status };
    }

    const body: ApiResponse<PingResult> = {
      success: true,
      data: {
        message: "✅ Next.js app is reachable",
        reachable: true,
        responseTimeMs,
        nextjsResponse,
      },
    };

    res.status(200).json(body);
  } catch (error) {
    const body: ApiResponse<PingResult> = {
      success: false,
      data: {
        message: "❌ Could not reach Next.js app",
        reachable: false,
        error: String(error),
      },
      error: `Next.js unreachable at ${config.nextjsUrl}`,
    };

    res.status(503).json(body);
  }
};
