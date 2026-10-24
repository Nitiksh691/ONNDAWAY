// Shared TypeScript types for the Node.js server

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface HealthStatus {
  status: "ok" | "degraded" | "down";
  service: string;
  timestamp: string;
  version: string;
  uptime: number;
  db: "connected" | "disconnected";
  environment: string;
}

export interface PingResult {
  message: string;
  reachable: boolean;
  responseTimeMs?: number;
  nextjsResponse?: unknown;
  error?: string;
}
