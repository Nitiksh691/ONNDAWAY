import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import Order from "@/models/Order";
import MenuItem from "@/models/MenuItem";
import Settings from "@/models/Settings";
import { withLogger } from "@/lib/withLogger";
import { normalizeCartLines } from "@/lib/orderLine";
import type { CartItem, OrderStatus } from "@/lib/types";

const _GET = async (req: NextRequest) => {
  await dbConnect();
  const userId = req.nextUrl.searchParams.get("userId");
  const status = req.nextUrl.searchParams.get("status");
  const deliveryPersonId = req.nextUrl.searchParams.get("deliveryPersonId");

  const filter: {
    userId?: string;
    status?: OrderStatus | { $in: OrderStatus[] };
    deliveryPersonId?: string;
  } = {};
  if (userId) filter.userId = userId;
  if (status) {
    if (status.includes(",")) {
      filter.status = { $in: status.split(",") as OrderStatus[] };
    } else {
      filter.status = status as OrderStatus;
    }
  }
  if (deliveryPersonId) filter.deliveryPersonId = deliveryPersonId;

  let query = Order.find(filter).sort({ createdAt: -1 });
  
  // Cap at 100 results for delivered/cancelled to prevent giant payloads
  // but let active statuses return all for the dashboard
  if (status === "delivered" || status === "cancelled" || !status) {
      query = query.limit(100);
  }

  const orders = await query.lean();

  // Map _id to id for frontend compatibility
  const mapped = orders.map((o: { _id: { toString: () => string } } & Record<string, unknown>) => ({ ...o, id: o._id.toString() }));
  return NextResponse.json(mapped);
};

const _POST = async (req: NextRequest) => {
  await dbConnect();

  const idempotencyKey = req.headers.get("Idempotency-Key");
  if (idempotencyKey) {
    const existingOrder = await Order.findOne({ idempotencyKey });
    if (existingOrder) {
      return NextResponse.json({ ...existingOrder.toObject(), id: existingOrder._id.toString() }, { status: 200 });
    }
  }

  const body = await req.json();
  const { userId, userName, userPhone, items, location, locationNotes, latitude, longitude, total, couponCode, discount, scheduledTime } = body;

  if (!userId || !items || !location) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const settings = await Settings.findOne();
  if (settings?.kitchenClosed) {
    return NextResponse.json({ error: `Kitchen is closed. We'll be open from ${settings.kitchenOpenTime || "soon"}.` }, { status: 403 });
  }

  const normalizedItems = normalizeCartLines(items as CartItem[]);

  // Aggregate required quantities by item ID
  const requiredStock: Record<string, number> = {};
  for (const item of normalizedItems) {
    const id = item.item.id;
    if (id) {
      requiredStock[id] = (requiredStock[id] || 0) + item.quantity;
    }
  }

  // Check availability
  const itemIds = Object.keys(requiredStock);
  const unavailableItems = await MenuItem.find({
    _id: { $in: itemIds },
    available: false
  }).select("_id").lean();

  if (unavailableItems.length > 0) {
    return NextResponse.json(
      { error: "One or more items are currently unavailable", itemId: unavailableItems[0]._id },
      { status: 409 }
    );
  }

  try {
    const order = await Order.create({
      idempotencyKey: idempotencyKey || undefined,
      userId,
      userName: userName || "Customer",
      userPhone: userPhone || "",
      items: normalizedItems,
      location,
      locationNotes: locationNotes || "",
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      total: total || 0,
      couponCode: couponCode || null,
      discount: discount || 0,
      status: "placed",
      paymentMethod: "COD",
      paymentStatus: "PENDING",
      scheduledTime: scheduledTime || "ASAP (~15 mins)",
      deliveryOtp: Math.floor(1000 + Math.random() * 9000).toString(),
      messages: [],
    });

    return NextResponse.json({ ...order.toObject(), id: order._id.toString() }, { status: 201 });
  } catch (error: any) {
    if (error.code === 11000 && error.keyPattern && error.keyPattern.idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        return NextResponse.json({ ...existingOrder.toObject(), id: existingOrder._id.toString() }, { status: 200 });
      }
    }
    throw error;
  }
};

export const GET  = withLogger("GET /api/orders",  _GET);
export const POST = withLogger("POST /api/orders", _POST);

