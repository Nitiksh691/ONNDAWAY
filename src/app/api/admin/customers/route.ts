import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import { withLogger } from "@/lib/withLogger";
import { requireAdmin } from "@/lib/adminAuth";

const _GET = async (req: Request) => {
  const authError = requireAdmin(req as any);
  if (authError) return authError;

  await dbConnect();
  try {
    // Single aggregation — DB groups, counts, and sums. No in-Node loops.
    const customers = await Order.aggregate([
      // Step 1: Only count non-cancelled orders for revenue/order stats
      {
        $facet: {
          // Branch A: group stats (totalSpent, totalOrders, lastOrderDate)
          stats: [
            { $match: { status: { $ne: "cancelled" } } },
            {
              $group: {
                _id: "$userId",
                name:          { $last: "$userName" },
                phone:         { $last: "$userPhone" },
                totalSpent:    { $sum: "$total" },
                totalOrders:   { $sum: 1 },
                lastOrderDate: { $max: "$createdAt" },
              },
            },
          ],
          // Branch B: unwind items to find each user's favourite item
          items: [
            { $match: { status: { $ne: "cancelled" } } },
            { $unwind: "$items" },
            {
              $group: {
                _id:       { userId: "$userId", item: "$items.item.name" },
                itemCount: { $sum: "$items.quantity" },
              },
            },
            { $sort: { itemCount: -1 } },
            {
              $group: {
                _id:           "$_id.userId",
                frequentItem:  { $first: "$_id.item" },
              },
            },
          ],
        },
      },
      // Step 2: Merge the two branches on userId
      {
        $project: {
          merged: {
            $map: {
              input: "$stats",
              as: "s",
              in: {
                $mergeObjects: [
                  "$$s",
                  {
                    $arrayElemAt: [
                      {
                        $filter: {
                          input: "$items",
                          as: "i",
                          cond: { $eq: ["$$i._id", "$$s._id"] },
                        },
                      },
                      0,
                    ],
                  },
                ],
              },
            },
          },
        },
      },
      { $unwind: "$merged" },
      { $replaceRoot: { newRoot: "$merged" } },
      { $sort: { totalSpent: -1 } },
    ]);

    // Shape output for frontend
    const result = customers.map((c) => ({
      userId:        c._id,
      name:          c.name  || "Unknown",
      phone:         c.phone || "Unknown",
      totalSpent:    c.totalSpent    ?? 0,
      totalOrders:   c.totalOrders   ?? 0,
      lastOrderDate: c.lastOrderDate ?? null,
      frequentItem:  c.frequentItem  || "None",
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
};

export const GET = withLogger("GET /api/admin/customers", _GET);


