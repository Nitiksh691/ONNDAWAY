import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

// GET /api/vendor/orders?vendorId=xxx[&status=pending]
// Returns orders that contain at least one item from this vendor
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const status = searchParams.get("status"); // optional filter

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  }

  const query: any = {
    $or: [
      { "items.vendorId": vendorId },
      { "items.item.vendorId": vendorId },
    ]
  };
  if (status) query.status = status;

  const orders = await Order.find(query)
    .sort({ createdAt: -1 })
    .limit(100)
    .lean();

  // For each order, only expose the vendor's own items (privacy & cleanliness)
  const sanitized = orders.map((o: any) => {
    const vendorItems = (o.items || []).filter((i: any) =>
      String(i.vendorId) === vendorId || String(i.item?.vendorId) === vendorId
    );

    return {
      _id: o._id,
      orderId: o.orderId || o._id?.toString().slice(-6),
      status: o.status,
      createdAt: o.createdAt,
      customerName: o.userName || o.customerName || "Customer",
      deliveryAddress: o.location || o.deliveryAddress || "",
      items: vendorItems.map((i: any) => ({
        name: i.item?.name || i.name || "Item",
        quantity: i.quantity || 1,
        price: i.unitPrice ?? i.item?.price ?? i.price ?? 0,
        vendorPacked: i.vendorPacked,
        vendorPackedAt: i.vendorPackedAt,
      })),
      vendorPackedAt: o.vendorPackedAt || (vendorItems[0]?.vendorPackedAt ?? null),
    };
  });

  return NextResponse.json(sanitized);
}

// PATCH /api/vendor/orders  { vendorId, orderId, action: "pack" }
// Vendor marks their portion as packed
export async function PATCH(req: NextRequest) {
  await dbConnect();
  const { vendorId, orderId, action } = await req.json();

  if (!vendorId || !orderId) {
    return NextResponse.json({ error: "vendorId and orderId required" }, { status: 400 });
  }

  const order = await Order.findOne({ _id: orderId });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Check vendor actually has items in this order
  const hasItems = order.items?.some((i: any) =>
    String(i.vendorId) === vendorId || String(i.item?.vendorId) === vendorId
  );
  if (!hasItems) return NextResponse.json({ error: "Not authorized" }, { status: 403 });

  if (action === "pack") {
    const now = new Date();
    for (const it of order.items || []) {
      if (String(it.vendorId) === vendorId || String(it.item?.vendorId) === vendorId) {
        it.vendorPacked = true;
        it.vendorPackedAt = now;
      }
    }
    const allPacked = (order.items || []).every((it: any) => it.vendorPacked);
    if (allPacked) {
      order.vendorPackedAt = now;
    }
    await order.save();
    return NextResponse.json({ ok: true, vendorPackedAt: order.vendorPackedAt || now });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
