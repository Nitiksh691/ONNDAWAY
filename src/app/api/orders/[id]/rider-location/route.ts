import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

/**
 * PATCH /api/orders/[id]/rider-location
 * Called by the rider's device every ~15s while delivering.
 * Body: { lat: number, lng: number, deliveryPersonId: string }
 */
export async function PATCH(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await props.params;
    const { lat, lng, deliveryPersonId } = await req.json();
    if (!lat || !lng || !deliveryPersonId) {
      return NextResponse.json({ error: "lat, lng and deliveryPersonId required" }, { status: 400 });
    }

    // Only update if this rider is actually assigned to this order
    const updated = await Order.findOneAndUpdate(
      { _id: id, deliveryPersonId, status: "out_for_delivery" },
      { $set: { "riderLocation.lat": lat, "riderLocation.lng": lng, "riderLocation.updatedAt": new Date() } },
      { new: true, select: "_id riderLocation" }
    );

    if (!updated) {
      return NextResponse.json({ error: "Order not found or you are not the assigned rider" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * GET /api/orders/[id]/rider-location
 * Polled by the customer tracking page every 10s.
 * Returns only the riderLocation, status, storeName, storeAddress fields — no sensitive data.
 */
export async function GET(_req: NextRequest, props: { params: Promise<{ id: string }> }) {
  await dbConnect();
  try {
    const { id } = await props.params;
    const order = await Order.findById(id)
      .select("status riderLocation latitude longitude location storeName storeAddress")
      .lean();

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    const res = NextResponse.json({
      status: order.status,
      riderLocation: (order as any).riderLocation ?? null,
      customerLat: (order as any).latitude ?? null,
      customerLng: (order as any).longitude ?? null,
      customerLocation: (order as any).location,
      storeName: (order as any).storeName ?? "",
      storeAddress: (order as any).storeAddress ?? "",
    });
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
