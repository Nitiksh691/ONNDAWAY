import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";

/**
 * POST /api/auth/customer
 *
 * Passwordless login/signup for customers based solely on their phone number.
 * If the phone number exists, we return the user (login).
 * If not, we create a new user with the provided name and optional image.
 */
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { phone, name, image, gender } = await req.json();

    if (!phone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    let user = await User.findOne({ userId: cleanPhone }).lean();

    if (!user) {
      // Create new customer
      if (!name) {
        return NextResponse.json(
          { error: "Name is required for new accounts" },
          { status: 400 }
        );
      }

      user = await User.create({
        userId: cleanPhone,
        phone: cleanPhone,
        name: name.trim(),
        image: image || "",
        gender: gender || "",
        role: "user",
      });
    } else {
      // Optional: Update image/name if provided during a re-login
      let updated = false;
      const updates: any = {};
      if (name && name.trim() !== user.name) {
        updates.name = name.trim();
        updated = true;
      }
      if (image && image !== user.image) {
        updates.image = image;
        updated = true;
      }
      if (gender && gender !== user.gender) {
        updates.gender = gender;
        updated = true;
      }
      
      if (updated) {
        user = await User.findOneAndUpdate(
          { userId: cleanPhone },
          { $set: updates },
          { new: true }
        ).lean();
      }
    }

    return NextResponse.json({ userId: user.userId }, { status: 200 });
  } catch (error) {
    console.error("Customer Auth error:", error);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
