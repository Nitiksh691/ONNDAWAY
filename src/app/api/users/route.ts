import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

export async function GET(req: NextRequest) {
  await dbConnect();
  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  const user = await User.findOne({ userId }).lean();
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ ...user, uid: user.userId });
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  // 🔒 SECURITY: Never accept `role` from client-side requests.
  // Role can only be changed via a dedicated admin endpoint.
  const { userId, name, year, accommodation, location, phone } = body;

  if (!userId || !name) return NextResponse.json({ error: "userId and name required" }, { status: 400 });

  const user = await User.findOneAndUpdate(
    { userId },
    { userId, name, year, accommodation, location, phone },
    // Only set role to "user" on INSERT (upsert), never overwrite existing role
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).lean();

  return NextResponse.json(user);
}
