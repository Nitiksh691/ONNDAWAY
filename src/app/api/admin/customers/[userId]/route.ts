import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";
import { withLogger } from "@/lib/withLogger";
import { requireAdmin } from "@/lib/adminAuth";

const _GET = async (
  req: Request,
  props: { params: Promise<{ userId: string }> }
) => {
  const authError = requireAdmin(req as any);
  if (authError) return authError;

  await dbConnect();
  try {
    const { userId } = await props.params;

    // Run both queries in parallel — no reason to wait for one before starting the other
    const [userDoc, orders] = await Promise.all([
      User.findOne({ userId }).lean(),
      Order.find({ userId }).sort({ createdAt: -1 }).lean(),
    ]);

    const mappedOrders = (orders as any[]).map((o) => ({
      ...o,
      id: o._id.toString(),
    }));

    // Compute stats in a single pass
    const nonCancelled = (orders as any[]).filter((o) => o.status !== "cancelled");
    const totalSpent = nonCancelled.reduce((s, o) => s + (o.total || 0), 0);
    const totalOrders = nonCancelled.length;

    // Find most ordered item
    const itemCounts: Record<string, number> = {};
    nonCancelled.forEach((o) => {
      (o.items || []).forEach((ci: any) => {
        const name = ci.item?.name;
        if (name) itemCounts[name] = (itemCounts[name] || 0) + (ci.quantity || 1);
      });
    });

    let favouriteItem = "None";
    let maxCount = 0;
    for (const [name, count] of Object.entries(itemCounts)) {
      if (count > maxCount) { maxCount = count; favouriteItem = name; }
    }

    return NextResponse.json({
      profile: userDoc ? {
        userId:        (userDoc as any).userId,
        name:          (userDoc as any).name,
        phone:         (userDoc as any).phone,
        year:          (userDoc as any).year,
        accommodation: (userDoc as any).accommodation,
        location:      (userDoc as any).location,
        role:          (userDoc as any).role,
        createdAt:     (userDoc as any).createdAt,
      } : null,
      stats: {
        totalOrders,
        totalSpent,
        favouriteItem,
        cancelledOrders: (orders as any[]).length - nonCancelled.length,
      },
      orders: mappedOrders,
    });
  } catch (error) {
    console.error("Error fetching customer detail:", error);
    return NextResponse.json({ error: "Failed to fetch customer details" }, { status: 500 });
  }
};

export const GET = withLogger("GET /api/admin/customers/[userId]", _GET as any);



