import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// In-memory store for rate limiting (isolated per Edge instance/Node process)
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

function getClientIp(req: NextRequest): string {
  // Try getting IP from headers, fallback to a default
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'unknown-ip';
}

function rateLimit(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || record.expiresAt < now) {
    // New window or expired window
    rateLimitMap.set(ip, { count: 1, expiresAt: now + windowMs });
    return true; // allowed
  }

  if (record.count >= limit) {
    return false; // rate limited
  }

  // Increment count
  record.count += 1;
  return true; // allowed
}

function pruneRateLimitMap() {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (value.expiresAt < now) {
      rateLimitMap.delete(key);
    }
  }
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
  
  // Only apply rate limiting to API routes
  if (!pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // Prune expired entries randomly (10% of requests) to save memory without interval
  if (Math.random() < 0.1) {
    pruneRateLimitMap();
  }

  const ip = getClientIp(req);

  // Auth routes (stricter limit to prevent brute force)
  if (pathname.startsWith('/api/auth/login') || pathname.startsWith('/api/auth/signup')) {
    const allowed = rateLimit(`auth_${ip}`, 10, 60000); // 10 requests per minute
    if (!allowed) {
      return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
    }
  }

  // General API routes limit (Admin / Orders)
  if (pathname.startsWith('/api/orders') || pathname.startsWith('/api/admin')) {
    const allowed = rateLimit(`api_${ip}`, 100, 60000); // 100 requests per minute
    if (!allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
