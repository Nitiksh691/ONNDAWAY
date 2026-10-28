import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import bcrypt from "bcryptjs";

// POST /api/vendor/auth { phone, pin } → { vendorId, name } or error
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { phone, pin } = await req.json();

    if (!phone || !pin) {
      return NextResponse.json({ error: "Phone and PIN required" }, { status: 400 });
    }

    const cleanPhone = String(phone).trim();
    const cleanPin = String(pin).trim();

    const vendor = await Vendor.findOne({ phone: cleanPhone, active: true });
    if (!vendor) {
      return NextResponse.json({ error: "No vendor found with that phone" }, { status: 401 });
    }

    let isPinValid = false;
    const isBcryptHash = vendor.pin && vendor.pin.startsWith("$2");

    if (isBcryptHash) {
      isPinValid = await bcrypt.compare(cleanPin, vendor.pin);
    } else {
      // Legacy plain-text PIN support: verify & automatically upgrade to bcrypt
      if (vendor.pin === cleanPin) {
        isPinValid = true;
        const newHash = await bcrypt.hash(cleanPin, 10);
        vendor.pin = newHash;
        await vendor.save();
      }
    }

    if (!isPinValid) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    return NextResponse.json({
      vendorId: vendor._id.toString(),
      name: vendor.name,
      businessName: vendor.businessName,
      revenueSharePct: vendor.revenueSharePct,
      storeId: vendor.storeId ? vendor.storeId.toString() : null,
    });
  } catch (error: any) {
    console.error("POST /api/vendor/auth error:", error);
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 });
  }
}
