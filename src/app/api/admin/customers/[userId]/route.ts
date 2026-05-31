import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Order from "@/models/Order";

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ userId: string }> }
) {
  await dbConnect();
  try {
    const params = await props.params;
    const userId = params.userId;

    // Fetch the user profile from the User collection
    const userDoc = await User.findOne({ userId }).lean();

    // Fetch all orders for this user, newest first
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();

    // Map _id → id for frontend compat
    const mappedOrders = orders.map((o: any) => ({
      ...o,
      id: o._id.toString(),
    }));

    // Compute stats
    const nonCancelled = orders.filter((o: any) => o.status !== "cancelled");
    const totalSpent = nonCancelled.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const totalOrders = nonCancelled.length;

    // Find most ordered item
    const itemCounts: Record<string, number> = {};
    nonCancelled.forEach((o: any) => {
      (o.items || []).forEach((ci: any) => {
        const name = ci.item?.name;
        if (name) itemCounts[name] = (itemCounts[name] || 0) + (ci.quantity || 1);
      });
    });
    let favouriteItem = "None";
    let maxCount = 0;
    for (const [name, count] of Object.entries(itemCounts)) {
      if (count > maxCount) {
        maxCount = count;
        favouriteItem = name;
      }
    }

    return NextResponse.json({
      profile: userDoc
        ? {
            userId: (userDoc as any).userId,
            name: (userDoc as any).name,
            phone: (userDoc as any).phone,
            year: (userDoc as any).year,
            accommodation: (userDoc as any).accommodation,
            location: (userDoc as any).location,
            role: (userDoc as any).role,
            createdAt: (userDoc as any).createdAt,
          }
        : null,
      stats: {
        totalOrders,
        totalSpent,
        favouriteItem,
        cancelledOrders: orders.length - nonCancelled.length,
      },
      orders: mappedOrders,
    });
  } catch (error) {
    console.error("Error fetching customer detail:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer details" },
      { status: 500 }
    );
  }
}
