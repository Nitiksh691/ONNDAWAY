import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, recordFailedAttempt, clearAttempts, getAdminToken } from "@/lib/adminAuth";

export async function POST(req: NextRequest) {
  // Rate limiting — max 5 attempts per IP per minute
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rateCheck = checkRateLimit(ip);

  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Try again in ${rateCheck.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rateCheck.retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const { passcode } = body;
    const adminPasscode = process.env.ADMIN_PASSCODE;

    if (!adminPasscode) {
      console.error("ADMIN_PASSCODE not set in env");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (passcode === adminPasscode) {
      clearAttempts(ip);
      // Return a signed token the client stores in sessionStorage
      const token = getAdminToken();
      return NextResponse.json({ success: true, token });
    } else {
      recordFailedAttempt(ip);
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
