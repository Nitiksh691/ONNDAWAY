/**
 * src/lib/adminAuth.ts
 *
 * Lightweight admin authentication middleware for API routes.
 *
 * HOW IT WORKS:
 * - When an admin logs in via /api/admin/auth, the server returns a signed token
 *   built from the ADMIN_PASSCODE env var + a secret salt.
 * - Subsequent admin API calls must include this token in the `x-admin-token` header.
 * - This file provides `requireAdmin(req)` which validates the token server-side.
 * - Nothing sensitive is ever stored client-side — the token is derived, not stored raw.
 */

import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";

// ── Rate Limiter for brute force protection ─────────────────────────────────
const failedAttempts = new Map<string, { count: number; resetAt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 1000; // 1 minute

export function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = failedAttempts.get(ip);

  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 0, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

export function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearAttempts(ip: string) {
  failedAttempts.delete(ip);
}

// ── Token Generation / Validation ───────────────────────────────────────────
function buildExpectedToken(): string | null {
  const passcode = process.env.ADMIN_PASSCODE;
  const salt = process.env.ADMIN_TOKEN_SALT || "onndaway_admin_salt_v1";
  if (!passcode) return null;
  // HMAC-like: sha256(passcode + salt + day-string) — rotates daily
  const dayStr = new Date().toISOString().slice(0, 10); // "2026-08-23"
  return createHash("sha256").update(`${passcode}:${salt}:${dayStr}`).digest("hex");
}

/**
 * Call this at the start of any admin-only API route.
 * Returns null if the request is authorized, or a 401/403 NextResponse if not.
 *
 * Usage:
 *   const authError = requireAdmin(req);
 *   if (authError) return authError;
 */
export function requireAdmin(req: NextRequest): NextResponse | null {
  const token = req.headers.get("x-admin-token");
  const expected = buildExpectedToken();

  if (!expected) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  if (!token || token !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return null; // ✅ Authorized
}

/**
 * Returns the current valid admin token.
 * Call this from GET /api/admin/auth after verifying the passcode,
 * and send it to the client to store in sessionStorage.
 */
export function getAdminToken(): string | null {
  return buildExpectedToken();
}
