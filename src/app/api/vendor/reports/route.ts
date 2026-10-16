import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

// GET /api/vendor/reports?vendorId=xxx[&period=7|30|90|all]
// Returns aggregated sales data for this vendor
export async function GET(req: NextRequest) {
  await dbConnect();
  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get("vendorId");
  const period = searchParams.get("period") || "30"; // days

  if (!vendorId) {
    return NextResponse.json({ error: "vendorId required" }, { status: 400 });
  }

  const dateFilter: any = {};
  if (period !== "all") {
    const days = parseInt(period);
    dateFilter.createdAt = { $gte: new Date(Date.now() - days * 24 * 3600 * 1000) };
  }

  // Orders that contain at least one item from this vendor, excluding cancelled or payment_pending
  const orders = await Order.find({
    $or: [
      { "items.vendorId": vendorId },
      { "items.item.vendorId": vendorId },
    ],
    status: { $nin: ["cancelled", "payment_pending"] },
    ...dateFilter,
  }).lean();

  // Aggregate per item
  const itemMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  let totalQty = 0;
  let totalRevenue = 0;

  for (const o of orders as any[]) {
    for (const item of o.items || []) {
      const itmVendorId = item.vendorId || item.item?.vendorId;
      if (String(itmVendorId) !== vendorId) continue;

      const name = item.item?.name || item.name || "Item";
      const key = item.item?.id || item.cartItemId || name;
      if (!itemMap[key]) itemMap[key] = { name, qty: 0, revenue: 0 };

      const qty = item.quantity || 1;
      const price = item.unitPrice ?? item.item?.price ?? item.price ?? 0;
      itemMap[key].qty += qty;
      itemMap[key].revenue += qty * price;
      totalQty += qty;
      totalRevenue += qty * price;
    }
  }

  const items = Object.values(itemMap).sort((a, b) => b.revenue - a.revenue);

  // Daily trend
  const daily: Record<string, number> = {};
  for (const o of orders as any[]) {
    const d = new Date(o.createdAt).toISOString().slice(0, 10);
    if (!daily[d]) daily[d] = 0;
    for (const item of o.items || []) {
      const itmVendorId = item.vendorId || item.item?.vendorId;
      if (String(itmVendorId) !== vendorId) continue;
      const qty = item.quantity || 1;
      const price = item.unitPrice ?? item.item?.price ?? item.price ?? 0;
      daily[d] += qty * price;
    }
  }

  const trend = Object.entries(daily)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => ({ date, revenue }));

  return NextResponse.json({
    period,
    totalOrders: orders.length,
    totalQty,
    totalRevenue,
    items,
    trend,
  });
}
