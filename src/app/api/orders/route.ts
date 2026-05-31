import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";

export async function GET(req: NextRequest) {
  await dbConnect();
  const userId = req.nextUrl.searchParams.get("userId");
  const status = req.nextUrl.searchParams.get("status");
  const deliveryPersonId = req.nextUrl.searchParams.get("deliveryPersonId");

  const filter: Partial<{ userId: string; status: string | { $in: string[] }; deliveryPersonId: string }> = {};
  if (userId) filter.userId = userId;
  if (status) {
    if (status.includes(",")) {
      filter.status = { $in: status.split(",") };
    } else {
      filter.status = status;
    }
  }
  if (deliveryPersonId) filter.deliveryPersonId = deliveryPersonId;

  const orders = await Order.find(filter).sort({ createdAt: -1 }).lean();

  // Map _id to id for frontend compatibility
  const mapped = orders.map((o: { _id: { toString: () => string } } & Record<string, unknown>) => ({ ...o, id: o._id.toString() }));
  return NextResponse.json(mapped);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const body = await req.json();
  const { userId, userName, userPhone, items, location, total, couponCode, discount, status, scheduledTime } = body;

  if (!userId || !items || !location) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const order = await Order.create({
    userId,
    userName: userName || "Customer",
    userPhone: userPhone || "",
    items,
    location,
    total: total || 0,
    couponCode: couponCode || null,
    discount: discount || 0,
    status: status || "placed",
    scheduledTime: scheduledTime || "ASAP (~15 mins)",
    deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
    messages: [],
  });

  return NextResponse.json({ ...order.toObject(), id: order._id.toString() }, { status: 201 });
}
