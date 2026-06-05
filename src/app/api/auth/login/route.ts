import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { withLogger } from "@/lib/withLogger";

/**
 * POST /api/auth/login
 *
 * Authenticates a user with username + password.
 * Uses bcrypt.compare() to safely validate against the stored hash.
 */
const _POST = async (req: NextRequest) => {
  await dbConnect();
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const user = await User.findOne({ username }).lean();

    if (!user) {
      // Return same error as wrong password to prevent user enumeration
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password ?? "");
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Update lastLoginAt
    await User.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } }
    );

    return NextResponse.json({ userId: user.userId }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to login" }, { status: 500 });
  }
};

export const POST = withLogger("POST /api/auth/login", _POST);
