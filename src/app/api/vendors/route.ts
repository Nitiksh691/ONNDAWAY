import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import bcrypt from "bcryptjs";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/vendors — list vendors (Admin gets full list without PINs, public gets active vendor summary)
export async function GET(req: NextRequest) {
  await dbConnect();
  try {
    const authError = requireAdmin(req);
    const isAdmin = authError === null;

    if (isAdmin) {
      // Admin view: full vendor list (excluding sensitive pin)
      const vendors = await Vendor.find({}).select("-pin").sort({ name: 1 }).lean();
      return NextResponse.json(vendors);
    }

    // Public / Menu view: safe list of active vendors only
    const vendors = await Vendor.find({ active: true })
      .select("_id name businessName active storeId")
      .sort({ name: 1 })
      .lean();
    return NextResponse.json(vendors);
  } catch (error: any) {
    console.error("GET /api/vendors error:", error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}

// POST /api/vendors — create/register vendor (hashes PIN securely)
export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const body = await req.json();
    const { name, businessName, phone, pin, email, revenueSharePct, notes, storeId } = body;

    if (!name || !phone || !pin) {
      return NextResponse.json({ error: "name, phone and pin are required" }, { status: 400 });
    }

    const cleanPin = String(pin).trim();
    if (cleanPin.length < 4) {
      return NextResponse.json({ error: "PIN must be at least 4 digits" }, { status: 400 });
    }

    // Securely hash the vendor PIN with bcrypt
    const hashedPin = await bcrypt.hash(cleanPin, 10);

    const vendor = await Vendor.create({
      name: name.trim(),
      businessName: businessName?.trim() || "",
      phone: phone.trim(),
      pin: hashedPin,
      email: email?.trim() || "",
      storeId: storeId || null,
      revenueSharePct: revenueSharePct != null ? Number(revenueSharePct) : 70,
      notes: notes || "",
      active: true,
      updatedAt: new Date(),
    });

    const vendorObj = vendor.toObject();
    delete vendorObj.pin;

    return NextResponse.json(vendorObj, { status: 201 });
  } catch (e: any) {
    if (e.code === 11000) {
      return NextResponse.json({ error: "Phone number already registered" }, { status: 409 });
    }
    console.error("POST /api/vendors error:", e);
    return NextResponse.json({ error: e.message || "Failed to create vendor" }, { status: 500 });
  }
}

// PATCH /api/vendors — update vendor (Admin Only)
export async function PATCH(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  try {
    const body = await req.json();
    const { id, ...update } = body;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    if (update.pin) {
      const cleanPin = String(update.pin).trim();
      if (cleanPin.length < 4) {
        return NextResponse.json({ error: "PIN must be at least 4 digits" }, { status: 400 });
      }
      update.pin = await bcrypt.hash(cleanPin, 10);
    }

    update.updatedAt = new Date();
    const vendor = await Vendor.findByIdAndUpdate(id, update, { new: true })
      .select("-pin")
      .lean();

    if (!vendor) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(vendor);
  } catch (error: any) {
    console.error("PATCH /api/vendors error:", error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

// DELETE /api/vendors?id=xxx (Admin Only)
export async function DELETE(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    await Vendor.findByIdAndDelete(id);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("DELETE /api/vendors error:", error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
