import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/** Salt rounds for bcrypt — 12 is a good balance of security and performance. */
const SALT_ROUNDS = 12;

/**
 * POST /api/auth/signup
 *
 * Creates a new admin or delivery staff account.
 * Passwords are hashed with bcrypt before persistence — never stored in plain text.
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const existingUser = await User.findOne({ username }).lean();
    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const userId =
      "user_" + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

    const user = await User.create({
      userId,
      username,
      password: hashedPassword,
      name: "",
      year: "",
      role: "user",
    });

    return NextResponse.json({ userId: user.userId }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to create account" },
      { status: 500 }
    );
  }
}
