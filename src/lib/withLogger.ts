/**
 * withLogger.ts — Higher-order function that wraps a Next.js API route handler.
 * Automatically logs: method, route, response status, duration, and any errors.
 * Usage:
 *   export const GET = withLogger("GET /api/menu", async (req) => { ... });
 */

import { NextRequest, NextResponse } from "next/server";
import { logger } from "./logger";

type Handler = (
  req: NextRequest,
  ctx?: { params: Promise<Record<string, string>> }
) => Promise<NextResponse> | NextResponse;

export function withLogger(route: string, handler: Handler): Handler {
  return async (req: NextRequest, ctx?: { params: Promise<Record<string, string>> }) => {
    const start = Date.now();
    const method = req.method ?? "UNKNOWN";
    try {
      const res = await handler(req, ctx);
      logger.api(method, route, res.status, Date.now() - start);
      // Attach a lightweight Server-Timing header so DevTools shows duration
      res.headers.set("Server-Timing", `handler;dur=${Date.now() - start}`);
      return res;
    } catch (err) {
      const durationMs = Date.now() - start;
      logger.error("unhandled_route_error", {
        method,
        route,
        durationMs,
        error: err instanceof Error ? err.message : String(err),
        stack: err instanceof Error ? err.stack?.split("\n").slice(0, 4).join(" | ") : undefined,
      });
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}
