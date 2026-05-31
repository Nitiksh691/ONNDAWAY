import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { passcode } = body;
    const adminPasscode = process.env.ADMIN_PASSCODE;

    if (!adminPasscode) {
      console.error("ADMIN_PASSCODE not set in env");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    if (passcode === adminPasscode) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Invalid passcode" }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
