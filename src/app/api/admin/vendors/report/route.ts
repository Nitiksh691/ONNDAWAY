import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Vendor from "@/models/Vendor";
import MenuItem from "@/models/MenuItem";
import Order from "@/models/Order";
import { requireAdmin } from "@/lib/adminAuth";

// GET /api/admin/vendors/report?period=30
export async function GET(req: NextRequest) {
  const authError = requireAdmin(req);
  if (authError) return authError;

  await dbConnect();
  const { searchParams } = new URL(req.url);
  const period = searchParams.get("period") || "30"; // days or "all"

  const dateFilter: any = {};
  if (period !== "all") {
    const days = parseInt(period);
    dateFilter.createdAt = { $gte: new Date(Date.now() - days * 24 * 3600 * 1000) };
  }

  const vendors = await Vendor.find({}).sort({ name: 1 }).lean();
  const menuItems = await MenuItem.find({ vendorId: { $ne: null } }).lean();

  const orders = await Order.find({
    status: { $nin: ["cancelled", "payment_pending"] },
    ...dateFilter,
  }).lean();

  const vendorStats = vendors.map((v: any) => {
    const vIdStr = v._id.toString();
    const assignedItems = menuItems.filter((m: any) => m.vendorId?.toString() === vIdStr);

    let totalOrders = 0;
    let unitsSold = 0;
    let grossSales = 0;
    const itemBreakdown: Record<string, { name: string; qty: number; revenue: number }> = {};

    for (const order of orders as any[]) {
      let orderHasVendor = false;
      for (const itm of order.items || []) {
        const itmVendorId = itm.vendorId || itm.item?.vendorId;
        if (String(itmVendorId) === vIdStr) {
          orderHasVendor = true;
          const qty = itm.quantity || 1;
          const price = itm.unitPrice ?? itm.item?.price ?? itm.price ?? 0;
          const name = itm.item?.name || itm.name || "Item";
          const rev = qty * price;

          unitsSold += qty;
          grossSales += rev;

          if (!itemBreakdown[name]) itemBreakdown[name] = { name, qty: 0, revenue: 0 };
          itemBreakdown[name].qty += qty;
          itemBreakdown[name].revenue += rev;
        }
      }
      if (orderHasVendor) totalOrders++;
    }

    const sharePct = v.revenueSharePct ?? 70;
    const vendorPayable = (grossSales * sharePct) / 100;
    const adminMargin = grossSales - vendorPayable;

    return {
      _id: v._id,
      name: v.name,
      businessName: v.businessName,
      phone: v.phone,
      pin: v.pin,
      active: v.active,
      revenueSharePct: sharePct,
      itemCount: assignedItems.length,
      totalOrders,
      unitsSold,
      grossSales,
      vendorPayable,
      adminMargin,
      items: Object.values(itemBreakdown).sort((a, b) => b.revenue - a.revenue),
    };
  });

  return NextResponse.json({
    period,
    vendors: vendorStats,
  });
}
