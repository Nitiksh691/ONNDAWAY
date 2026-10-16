import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/models/Vendor";

// GET /api/vendors — list all (admin only, no auth check for MVP)
export async function GET() {
  await dbConnect();
  const vendors = await Vendor.find({}).sort({ name: 1 }).lean();
  return NextResponse.json(vendors);
}

// POST /api/vendors — create vendor
export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { name, businessName, phone, pin, email, revenueSharePct, notes } = body;
  if (!name || !phone || !pin) {
    return NextResponse.json({ error: "name, phone and pin are required" }, { status: 400 });
  }
  try {
    const vendor = await Vendor.create({
      name, businessName, phone, pin, email,
      revenueSharePct: revenueSharePct ?? 70,
      notes,
      active: true,
      updatedAt: new Date(),
    });
    return NextResponse.json(vendor, { status: 201 });
  } catch (e: any) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// PATCH /api/vendors — update vendor
export async function PATCH(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { id, ...update } = body;
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  update.updatedAt = new Date();
  const vendor = await Vendor.findByIdAndUpdate(id, update, { new: true }).lean();
  if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(vendor);
}

// DELETE /api/vendors?id=xxx
export async function DELETE(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await Vendor.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}
