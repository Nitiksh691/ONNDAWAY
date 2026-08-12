import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import { appCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";
import { withLogger } from "@/lib/withLogger";

/**
 * GET /api/admin/analytics
 *
 * Returns pre-computed analytics stats in a single response.
 * Runs two DB aggregations in parallel — the browser never needs to
 * download all raw orders again.
 *
 * Response shape:
 * {
 *   summary: { totalRevenue, todayRevenue, totalOrders, todayOrders, avgOrderValue, uniqueUsers }
 *   statusBreakdown: { placed: N, preparing: N, ... }
 *   bestSellers: [{ name, count }]
 *   revenueByDay: [{ date: "2025-06-01", revenue: 1200, orders: 8 }]  (last 30 days)
 *   ordersByHour: [{ hour: "8:00", orders: 15 }]
 * }
 */
const _GET = async () => {
  await dbConnect();
  try {
    // Try cache first
    const cached = appCache.get<object>(CACHE_KEYS.ANALYTICS);
    if (cached) {
      const res = NextResponse.json(cached);
      res.headers.set("X-Cache", "HIT");
      return res;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    // Run all aggregations in parallel
    const [
      summaryResult = [],
      statusResult = [],
      bestSellersResult = [],
      revenueByDayResult = [],
      uniqueUserIds = [],
      ordersByHourRaw = [],
    ] = await Promise.all([
        // 1. Summary stats
        Order.aggregate([
          {
            $facet: {
              total: [
                { $match: { status: "delivered" } },
                {
                  $group: {
                    _id: null,
                    totalRevenue: { $sum: "$total" },
                    totalOrders:  { $sum: 1 },
                    avgOrderValue: { $avg: "$total" },
                  },
                },
              ],
              today: [
                {
                  $match: {
                    status: "delivered",
                    createdAt: { $gte: todayStart },
                  },
                },
                {
                  $group: {
                    _id: null,
                    todayRevenue: { $sum: "$total" },
                    todayOrders:  { $sum: 1 },
                  },
                },
              ],
              todayAll: [
                { $match: { createdAt: { $gte: todayStart } } },
                { $group: { _id: null, todayTotalOrders: { $sum: 1 } } },
              ],
            },
          },
        ]),

        // 2. Order status breakdown
        Order.aggregate([
          { $group: { _id: "$status", count: { $sum: 1 } } },
        ]),

        // 3. Best sellers (top 5 items by quantity sold in delivered orders)
        Order.aggregate([
          { $match: { status: "delivered" } },
          { $unwind: "$items" },
          {
            $group: {
              _id: "$items.item.name",
              count: { $sum: "$items.quantity" },
            },
          },
          { $sort: { count: -1 } },
          { $limit: 5 },
          { $project: { _id: 0, name: "$_id", count: 1 } },
        ]),

        // 4. Revenue by day (last 30 days)
        Order.aggregate([
          {
            $match: {
              status: "delivered",
              createdAt: { $gte: thirtyDaysAgo },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
              },
              revenue: { $sum: "$total" },
              orders:  { $sum: 1 },
            },
          },
          { $sort: { _id: 1 } },
          { $project: { _id: 0, date: "$_id", revenue: 1, orders: 1 } },
        ]),

        // 5. Unique Users count
        Order.distinct("userId"),

        // 6. Orders by hour (all time or just today? Let's do all time to match previous dashboard logic)
        Order.aggregate([
          {
            $group: {
              _id: { $hour: { date: "$createdAt", timezone: "Asia/Kolkata" } },
              orders: { $sum: 1 }
            }
          },
          { $match: { _id: { $gte: 8, $lte: 22 } } }, // Only keep 8 AM to 10 PM
          { $sort: { _id: 1 } },
          { $project: { _id: 0, hour: { $concat: [{ $toString: "$_id" }, ":00"] }, orders: 1 } }
        ])
      ]);

    // Shape the summary
    const totalRow   = summaryResult[0]?.total?.[0]   ?? {};
    const todayRow   = summaryResult[0]?.today?.[0]   ?? {};
    const todayAllRow = summaryResult[0]?.todayAll?.[0] ?? {};

    const summary = {
      totalRevenue:  totalRow.totalRevenue   ?? 0,
      todayRevenue:  todayRow.todayRevenue   ?? 0,
      totalOrders:   totalRow.totalOrders    ?? 0,
      todayOrders:   todayAllRow.todayTotalOrders ?? 0,
      avgOrderValue: Math.round(totalRow.avgOrderValue ?? 0),
      uniqueUsers:   uniqueUserIds.length,
    };

    // Shape status breakdown
    const statusBreakdown = Object.fromEntries(
      (statusResult as { _id: string; count: number }[]).map((s) => [s._id, s.count])
    );

    // Map ordersByHour to guarantee 8:00 to 22:00
    const rawHours = ordersByHourRaw as { hour: string; orders: number }[];
    const hoursMap: Record<string, number> = {};
    for (let i = 8; i <= 22; i++) hoursMap[`${i}:00`] = 0;
    if (Array.isArray(rawHours)) {
      rawHours.forEach(h => hoursMap[h.hour] = h.orders);
    }
    const ordersByHour = Object.entries(hoursMap).map(([hour, orders]) => ({ time: hour, orders }));

    const payload = {
      summary,
      statusBreakdown,
      bestSellers: bestSellersResult,
      revenueByDay: revenueByDayResult,
      ordersByHour
    };

    appCache.set(CACHE_KEYS.ANALYTICS, payload, CACHE_TTL.ANALYTICS);

    const res = NextResponse.json(payload);
    res.headers.set("X-Cache", "MISS");
    return res;
  } catch (error) {
    console.error("Analytics error:", error);
    return NextResponse.json({ error: "Failed to fetch analytics" }, { status: 500 });
  }
};

export const GET = withLogger("GET /api/admin/analytics", _GET);
