/**
 * logger.ts — Lightweight structured JSON logger.
 * Zero external dependencies. Outputs JSON to stdout/stderr.
 * Compatible with Vercel logs, Datadog, Logtail, and any log aggregator.
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  msg: string;
  ts: string;
  [key: string]: unknown;
}

function emit(level: LogLevel, msg: string, meta?: Record<string, unknown>): void {
  // Skip debug logs in production to keep noise low
  if (level === "debug" && process.env.NODE_ENV === "production") return;

  const entry: LogEntry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...meta,
  };

  const line = JSON.stringify(entry);
  if (level === "error") {
    console.error(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  info:  (msg: string, meta?: Record<string, unknown>) => emit("info",  msg, meta),
  warn:  (msg: string, meta?: Record<string, unknown>) => emit("warn",  msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => emit("error", msg, meta),
  debug: (msg: string, meta?: Record<string, unknown>) => emit("debug", msg, meta),

  /** Log a completed API request */
  api: (method: string, route: string, status: number, durationMs: number, meta?: Record<string, unknown>) =>
    emit(status >= 500 ? "error" : status >= 400 ? "warn" : "info", "api_request", {
      method, route, status, durationMs, ...meta,
    }),

  /** Log an important order lifecycle event */
  order: (event: string, orderId: string, meta?: Record<string, unknown>) =>
    emit("info", "order_event", { event, orderId, ...meta }),

  /** Log a DB query duration (dev only) */
  db: (collection: string, op: string, durationMs: number) =>
    emit("debug", "db_query", { collection, op, durationMs }),
};

export default logger;
