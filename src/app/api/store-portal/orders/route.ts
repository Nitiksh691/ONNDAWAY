import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import Store from "@/models/Store";

export async function GET(req: NextRequest) {
  await dbConnect();
  const storeId = req.nextUrl.searchParams.get("storeId");
  const phone = req.nextUrl.searchParams.get("phone");

  if (!storeId && !phone) {
    return NextResponse.json({ error: "storeId or phone is required" }, { status: 400 });
  }

  try {
    let resolvedStoreId = storeId;
    if (!resolvedStoreId && phone) {
      const store = await Store.findOne({ phone }).lean();
      if (!store) return NextResponse.json({ error: "Store not found" }, { status: 404 });
      resolvedStoreId = store._id.toString();
    }

    const orders = await Order.find({ storeId: resolvedStoreId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const mapped = orders.map((o: any) => ({
      ...o,
      id: o._id.toString(),
    }));

    return NextResponse.json(mapped);
  } catch (error: any) {
    console.error("GET /api/store-portal/orders error:", error);
    return NextResponse.json({ error: "Failed to fetch store orders" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  await dbConnect();
  try {
    const { orderId, storeId, status, isPacked } = await req.json();

    if (!orderId || !storeId) {
      return NextResponse.json({ error: "orderId and storeId are required" }, { status: 400 });
    }

    const order = await Order.findOne({ _id: orderId, storeId });
    if (!order) {
      return NextResponse.json({ error: "Order not found for this store" }, { status: 404 });
    }

    if (status) {
      order.status = status;
    }
    if (isPacked !== undefined) {
      order.vendorPackedAt = isPacked ? new Date() : null;
      if (Array.isArray(order.items)) {
        order.items.forEach((item: any) => {
          item.vendorPacked = isPacked;
          item.vendorPackedAt = isPacked ? new Date() : null;
        });
      }
    }

    await order.save();
    return NextResponse.json({ success: true, order: { ...order.toObject(), id: order._id.toString() } });
  } catch (error: any) {
    console.error("PATCH /api/store-portal/orders error:", error);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
