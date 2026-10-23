import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Store from "@/models/Store";

export async function POST(req: NextRequest) {
  await dbConnect();
  try {
    const { phone, pin } = await req.json();

    if (!phone || !pin) {
      return NextResponse.json({ error: "Phone number and PIN are required" }, { status: 400 });
    }

    const cleanPhone = phone.trim();
    const cleanPin = pin.trim();

    const store = await Store.findOne({ phone: cleanPhone });
    if (!store) {
      return NextResponse.json({ error: "Store not found with this phone number" }, { status: 404 });
    }

    if (store.pin !== cleanPin) {
      return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      store: {
        id: store._id.toString(),
        name: store.name,
        slug: store.slug,
        code: store.code,
        address: store.address,
        phone: store.phone,
        isActive: store.isActive,
        isAcceptingOrders: store.isAcceptingOrders,
        isBusy: !!store.isBusy,
        openingTime: store.openingTime,
        closingTime: store.closingTime,
        serviceRadiusKm: store.serviceRadiusKm,
        serviceAreas: store.serviceAreas || [],
      },
    });
  } catch (error: any) {
    console.error("POST /api/store-portal/auth error:", error);
    return NextResponse.json({ error: "Authentication failed", details: error.message }, { status: 500 });
  }
}
