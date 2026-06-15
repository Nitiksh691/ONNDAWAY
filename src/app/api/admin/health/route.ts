import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { appCache } from "@/lib/cache";
import { withLogger } from "@/lib/withLogger";

/**
 * GET /api/admin/health
 *
 * Lightweight health check — no writes, no heavy queries.
 * Returns DB status, process health, and cache stats.
 * Use this to verify the server is alive without burdening it.
 */
const _GET = async () => {
  const start = Date.now();

  // Check DB connection state without making a real query
  const dbState = mongoose.connection.readyState;
  const dbStatusMap: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const dbStatus = dbStatusMap[dbState] ?? "unknown";

  // Memory usage
  const memRaw = process.memoryUsage();
  const mb = (bytes: number) => `${Math.round(bytes / 1024 / 1024)}MB`;

  const payload = {
    status:  dbState === 1 ? "ok" : "degraded",
    ts:      new Date().toISOString(),
    uptime:  `${Math.round(process.uptime())}s`,
    db:      dbStatus,
    cache:   appCache.stats(),
    memory: {
      rss:        mb(memRaw.rss),
      heap:       mb(memRaw.heapUsed),
      heapTotal:  mb(memRaw.heapTotal),
      external:   mb(memRaw.external),
    },
    pingMs: Date.now() - start,
    node:   process.version,
  };

  return NextResponse.json(payload, {
    status: payload.status === "ok" ? 200 : 503,
  });
};

export const GET = withLogger("GET /api/admin/health", _GET);
