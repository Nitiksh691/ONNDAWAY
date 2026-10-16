import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/models/Vendor";

// POST /api/vendor/auth  { phone, pin }  → { vendorId, name } or error
export async function POST(req: NextRequest) {
  await dbConnect();
  const { phone, pin } = await req.json();

  if (!phone || !pin) {
    return NextResponse.json({ error: "Phone and PIN required" }, { status: 400 });
  }

  const vendor = await Vendor.findOne({ phone: phone.trim(), active: true }).lean() as any;
  if (!vendor) {
    return NextResponse.json({ error: "No vendor found with that phone" }, { status: 401 });
  }
  if (vendor.pin !== pin.trim()) {
    return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
  }

  return NextResponse.json({
    vendorId: vendor._id.toString(),
    name: vendor.name,
    businessName: vendor.businessName,
    revenueSharePct: vendor.revenueSharePct,
  });
}
